import { COMMAND_UNMONITOR_FILE } from '../constants';
import { unmonitorFile } from '../fileHandlers';
import { uriFromExplorerContextOrEditorContext } from './shared';
import { checkFileCommand } from './abstract/createCommand';
import { getWorkspaceFolders } from '../host';

export default checkFileCommand({
  id: COMMAND_UNMONITOR_FILE,
  getFileTarget: uriFromExplorerContextOrEditorContext,

  async handleFile(ctx) {
    const workspaceFolders = getWorkspaceFolders();
    if (workspaceFolders) {
      await unmonitorFile(ctx, {
        ignore: null,
        configPath: workspaceFolders[0].uri.fsPath
      });
    }
  },
});
