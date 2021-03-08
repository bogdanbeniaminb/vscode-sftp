import {
  COMMAND_UNMONITOR,
  COMMAND_MONITOR_FILES_REFRESH,
} from './../../constants';
import * as vscode from 'vscode';
import {
  MonitoredTreeDataProvider,
  MonitoredTreeItem,
} from './treeDataProvider';
import { registerCommand } from '../../host';

export default class MonitoredFilesExplorer {
  private _explorerView: vscode.TreeView<MonitoredTreeItem>;
  public _treeDataProvider: MonitoredTreeDataProvider;

  constructor(context: vscode.ExtensionContext) {
    this._treeDataProvider = new MonitoredTreeDataProvider();

    this._explorerView = vscode.window.createTreeView('monitoredFiles', {
      showCollapseAll: true,
      treeDataProvider: this._treeDataProvider,
    });

    registerCommand(context, COMMAND_UNMONITOR, (item: MonitoredTreeItem) =>
      this._treeDataProvider.unmonitor(item)
    );

    registerCommand(context, COMMAND_MONITOR_FILES_REFRESH, () => {
      this._treeDataProvider.refresh();
    });
  }

  reveal(item: MonitoredTreeItem): Thenable<void> {
    return item ? this._explorerView.reveal(item) : Promise.resolve();
  }
}
