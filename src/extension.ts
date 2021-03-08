'use strict';

import { COMMAND_MONITOR_FILES_REFRESH } from './constants';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import app from './app';
import initCommands from './initCommands';
import { reportError } from './helper';
import fileActivityMonitor from './modules/fileActivityMonitor';
import { tryLoadConfigs } from './modules/config';
import {
  getAllFileService,
  createFileService,
  disposeFileService,
} from './modules/serviceManager';
import { getWorkspaceFolders, setContextValue } from './host';
import RemoteExplorer from './modules/remoteExplorer';
import MonitoredFilesExplorer from './modules/monitoredFiles';

async function setupWorkspaceFolder(dir) {
  const configs = await tryLoadConfigs(dir);
  configs.forEach(config => {
    createFileService(config, dir);
  });
  vscode.commands.executeCommand(COMMAND_MONITOR_FILES_REFRESH);
}

function setup(workspaceFolders: readonly vscode.WorkspaceFolder[]) {
  fileActivityMonitor.init();
  const pendingInits = workspaceFolders.map(folder =>
    setupWorkspaceFolder(folder.uri.fsPath)
  );

  return Promise.all(pendingInits);
}

export class WatcherDecorationProvider
  implements vscode.FileDecorationProvider {
  workspace: string;
  config;

  _onDidChangeFileDecorations: vscode.EventEmitter<
    undefined | vscode.Uri | vscode.Uri[]
  > = new vscode.EventEmitter<undefined | vscode.Uri | vscode.Uri[]>();

  onDidChangeFileDecorations: vscode.Event<
    undefined | vscode.Uri | vscode.Uri[]
  > = this._onDidChangeFileDecorations.event;

  constructor() {
    const workspaceFolders = getWorkspaceFolders();
    if (workspaceFolders) {
      this.workspace = workspaceFolders[0].uri.fsPath;
      tryLoadConfigs(this.workspace)
        .then(configs => {
          if (configs.length) return configs[0];
          return configs;
        })
        .then(config => {
          this.config = config;
          this._onDidChangeFileDecorations.fire(undefined);
        });
    }
  }

  refresh() {
    if (!this.workspace) return;

    tryLoadConfigs(this.workspace)
      .then(configs => {
        if (configs.length) return configs[0];
        return configs;
      })
      .then(config => {
        this.config = config;
        this._onDidChangeFileDecorations.fire(undefined);
      });
  }

  isMonitored(uri: vscode.Uri) {
    let files = this.config.watcher ? this.config.watcher.files : [];
    if (!Array.isArray(files)) files = [files];
    const relativePath = uri.fsPath.replace(this.workspace + '/', '');
    return (
      files.includes(relativePath) || files.includes(relativePath + '/**/*')
    );
  }

  provideFileDecoration(uri: vscode.Uri, token: vscode.CancellationToken) {
    const decoration = new vscode.FileDecoration();
    if (this.isMonitored(uri)) {
      decoration.badge = 'W';
      decoration.tooltip = 'Watching for SFTP sync';
    }
    return decoration;
  }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  try {
    initCommands(context);
  } catch (error) {
    reportError(error, 'initCommands');
  }

  const workspaceFolders = getWorkspaceFolders();
  if (!workspaceFolders) {
    return;
  }

  setContextValue('enabled', true);
  app.sftpBarItem.show();
  app.state.subscribe(_ => {
    const currentText = app.sftpBarItem.getText();
    // current is showing profile
    if (currentText.startsWith('SFTP')) {
      app.sftpBarItem.reset();
    }
    if (app.remoteExplorer) {
      app.remoteExplorer.refresh();
    }
    if (app.monitoredFilesExplorer) {
      app.monitoredFilesExplorer._treeDataProvider.refresh();
    }
  });
  try {
    await setup(workspaceFolders);
    app.remoteExplorer = new RemoteExplorer(context);
    app.monitoredFilesExplorer = new MonitoredFilesExplorer(context);
    app.decorationProvider = new WatcherDecorationProvider();

    vscode.window.registerFileDecorationProvider(app.decorationProvider);
  } catch (error) {
    reportError(error);
  }
}

export function deactivate() {
  fileActivityMonitor.destory();
  getAllFileService().forEach(disposeFileService);
}
