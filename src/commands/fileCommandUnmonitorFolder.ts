import { COMMAND_UNMONITOR_FOLDER } from '../constants';
import { unmonitorFolder } from '../fileHandlers';
import { checkFileCommand } from './abstract/createCommand';
import { uriFromExplorerContextOrEditorContext } from './shared';
import { getWorkspaceFolders } from '../host';

export default checkFileCommand({
  id: COMMAND_UNMONITOR_FOLDER,
  getFileTarget: uriFromExplorerContextOrEditorContext,

  async handleFile(ctx) {
    const workspaceFolders = getWorkspaceFolders();
    if (workspaceFolders) {
      await unmonitorFolder(ctx, {
        ignore: null,
        configPath: workspaceFolders[0].uri.fsPath
      });
    }
  },
});
