import { COMMAND_MONITOR_FILE } from '../constants';
import { monitorFile } from '../fileHandlers';
import { uriFromExplorerContextOrEditorContext } from './shared';
import { checkFileCommand } from './abstract/createCommand';
import { getWorkspaceFolders } from '../host';

export default checkFileCommand({
  id: COMMAND_MONITOR_FILE,
  getFileTarget: uriFromExplorerContextOrEditorContext,

  async handleFile(ctx) {
    const workspaceFolders = getWorkspaceFolders();
    if (workspaceFolders) {
      await monitorFile(ctx, {
        ignore: null,
        configPath: workspaceFolders[0].uri.fsPath
      });
    }
  },
});
