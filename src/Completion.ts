import * as vscode from 'vscode';
import { Current_Setting, ExtensionID } from './extension';

function generateLuaRequireStatement(filePath: string): Module | null {
     const match = filePath.match(/src\/(.+?)\/(.+?)\.lua$/);
     if (!match) {
          return null;
     }

     const [, Service, fileName] = match;
     const segments = fileName.split('/').filter(segment => segment !== '');
     
     var objectName = segments[segments.length - 1];
     if (objectName === ".src" || objectName === ".source") {
          segments.pop();
     }
     objectName = segments[segments.length - 1];

     var path = `game:GetService("${Service}")`;
     for (let i = 0; i < segments.length; i++) {
          path += `:WaitForChild("${segments[i]}")`;
     }

     return {
          name: objectName,
          path: path,
          Service: Service
     };
}

class Module {
     constructor(public name: string, public path: string, public Service: string) { }
}

export function Add_Module(Module: Module) {
     const editor = vscode.window.activeTextEditor;
     if (editor) {
          //const currentPosition = editor.selection.active;
          const firstLine = editor.document.lineAt(0).range;
          editor.edit(editBuilder => {
               editBuilder.insert(firstLine.start, `local ${Module.name} = require(${Module.path})\n`);
          }).then(() => {
               //editor.selection = new vscode.Selection(currentPosition.line + 1, 0, currentPosition.line + 1, 0);
          });
     }
}

var Current_Completion: { [key: string]: vscode.Disposable } = {};


export async function Add_Completion(File: vscode.Uri) {
     if (Current_Completion[File.path]) { return; }

     var Module_Check = generateLuaRequireStatement(File.path);
     if (Module_Check === null) { return; }

     var Module: Module = Module_Check;

     Current_Completion[File.path] =
          vscode.languages.registerCompletionItemProvider('lua', {
               provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

                    var label;
                    var description;

                    if (Current_Setting.Show_Service_In_Type) {
                         label = `${Module.name} (${Module.Service})`;
                         description = "";
                    } else {
                         label = Module.name;
                         description = Module.Service;
                    }

                    const This_Completion = new vscode.CompletionItem(
                         {
                              label: label,
                              description: description
                         },
                         vscode.CompletionItemKind.Module
                    );

                    This_Completion.insertText = Module.name;

                    const docs = new vscode.MarkdownString();
                    docs.appendCodeblock(Module.path.replaceAll(":W", "\n:W"), 'lua');
                    This_Completion.documentation = docs;

                    This_Completion.command = {
                         command: `${ExtensionID}.AddModule`, title: "XD", arguments: [{
                              name: Module.name,
                              path: Module.path
                         }]
                    };

                    return [
                         This_Completion
                    ];
               }
          });
}

export function Remove_Completion(File: vscode.Uri) {
     if (Current_Completion[File.path]) {
          Current_Completion[File.path].dispose();
          delete Current_Completion[File.path];
     }
}

export function Clear_Completion() {
     for (const Completion of Object.values(Current_Completion)) {
          Completion.dispose();
     }
     Current_Completion = {};
}