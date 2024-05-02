import * as vscode from 'vscode';
import { Add_Completion, Clear_Completion } from './Completion';
import { LoadSetting } from './extension';

const AllCommands: { [key: string]: Function } = {};

AllCommands["Load all modules"] = async function () {
     var statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
     statusBar.text = '(Argon module requirer) Loading all modules please wait!';
     statusBar.show();

     const Get_Modules = await vscode.workspace.findFiles('src/**/*.lua', 'src/**/*.{server.lua,client.lua}');
     for (const File of Get_Modules) {
          await Add_Completion(File);
     }

     statusBar.text = '(Argon module requirer) Complete!';
     setTimeout(() => {
          statusBar.dispose();
     }, 2000);
};

AllCommands["Reload all modules"] = async function () {
     await LoadSetting();
     Clear_Completion();
     AllCommands["Load all modules"]();
};

export default AllCommands;