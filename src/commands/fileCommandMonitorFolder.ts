import { COMMAND_MONITOR_FOLDER } from '../constants';
import { monitorFolder } from '../fileHandlers';
import { checkFileCommand } from './abstract/createCommand';
import { uriFromExplorerContextOrEditorContext } from './shared';
import { getWorkspaceFolders } from '../host';

export default checkFileCommand({
  id: COMMAND_MONITOR_FOLDER,
  getFileTarget: uriFromExplorerContextOrEditorContext,

  async handleFile(ctx) {
    const workspaceFolders = getWorkspaceFolders();
    if (workspaceFolders) {
      await monitorFolder(ctx, {
        ignore: null,
        configPath: workspaceFolders[0].uri.fsPath
      });
    }
  },
});
