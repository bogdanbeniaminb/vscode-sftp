import * as vscode from 'vscode';
import { Uri } from 'vscode';
import { getWorkspaceFolders } from '../../host';
import { tryLoadConfigs, changeWatcherConfig } from '../config';

export class MonitoredTreeDataProvider
  implements vscode.TreeDataProvider<MonitoredTreeItem> {
  _onDidChangeTreeData: vscode.EventEmitter<
    MonitoredTreeItem
  > = new vscode.EventEmitter<MonitoredTreeItem>();
  readonly onDidChangeTreeData: vscode.Event<MonitoredTreeItem> = this
    ._onDidChangeTreeData.event;

  data: MonitoredTreeItem[];
  workspace: string;

  constructor() {
    const workspaceFolders = getWorkspaceFolders();
    if (workspaceFolders) {
      this.workspace = workspaceFolders[0].uri.fsPath;
      tryLoadConfigs(this.workspace)
        .then(configs => {
          if (configs.length) return configs[0];
          return configs;
        })
        .then(config => config.watcher.files || [])
        .then(files => {
          const data = files.map(file => new MonitoredTreeItem(file));
          this.data = data;
        });
    }
  }

  getTreeItem(
    element: MonitoredTreeItem
  ): MonitoredTreeItem | Thenable<MonitoredTreeItem> {
    return element;
  }

  getChildren(
    element?: MonitoredTreeItem | undefined
  ): vscode.ProviderResult<MonitoredTreeItem[]> {
    if (element === undefined) {
      return this.data;
    }
    return element.children;
  }

  unmonitor(element?: MonitoredTreeItem | undefined) {
    if (element !== undefined) {
      changeWatcherConfig(this.workspace, {
        remove: [element.label],
      });
    }
  }

  refresh() {
    tryLoadConfigs(this.workspace)
      .then(configs => {
        if (configs.length) return configs[0];
        return configs;
      })
      .then(config => config.watcher.files || [])
      .then(files => {
        const data = files.map(file => new MonitoredTreeItem(file));
        this.data = data;
      });

    this._onDidChangeTreeData.fire();
  }
}

export class MonitoredTreeItem extends vscode.TreeItem {
  children: MonitoredTreeItem[] | undefined;

  constructor(
    label: string,
    children?: MonitoredTreeItem[],
    id?: string,
    path?: Uri
  ) {
    super(
      label,
      children === undefined
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Expanded
    );
    this.id = id;
    this.resourceUri = path;
    this.children = children;
  }
}
