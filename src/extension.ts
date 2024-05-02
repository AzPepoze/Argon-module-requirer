// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import AllCommands from './Commands';
import { Add_Completion, Add_Module, Clear_Completion, Remove_Completion } from './Completion';

export var ExtensionID = "argon-module-requirer";

function Check_Is_Module_File(File: vscode.Uri) {
	if (
		File.path.endsWith(".client.lua") || File.path.endsWith(".server.lua")
	) {
		return false;
	}
	return true;
}

export var Current_Setting: { [key: string]: any } = {
	Show_Service_In_Type: false
};

var Setting_File_Name = ".argon.requirer.json";

async function Load_JSON(File: vscode.Uri): Promise<any | null> {
	try {
		const content = await vscode.workspace.fs.readFile(File);
		return JSON.parse(content.toString());
	} catch (error) {
		vscode.window.showErrorMessage(`Error loading JSON file: ${error}`);
		return null;
	}
}

export async function Check_File_Exists(File: vscode.Uri) {
	return await vscode.workspace.fs.stat(File).then(() => true, () => false);
}

export async function Check_File_Exists_Workspace(name: string) {
	const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, name);
	return await Check_File_Exists(uri);
}

async function Create_File(name: string, content: string) {
	const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, name);
	try {
		const exists = await Check_File_Exists(uri);
		if (!exists) {
			await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content));
			vscode.window.showInformationMessage(`Added ${name} successfully!`);
		}
		return uri;
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to create file ${name}: ${error}`);
	}
}

async function Replace_Content(fileUri: vscode.Uri, content: string): Promise<void> {
	try {
		const newContent = new TextEncoder().encode(content);
		await vscode.workspace.fs.writeFile(fileUri, newContent);
		vscode.window.showInformationMessage(`Content replaced for ${fileUri.fsPath}`);
	} catch (error) {
		vscode.window.showErrorMessage(`Error replacing content for ${fileUri.fsPath}: ${error}`);
	}
}

export async function LoadSetting() {
	var Setting_File = await vscode.workspace.findFiles(`**/${Setting_File_Name}`);
	if (Setting_File.length > 0) {
		var Current_Setting_File = Setting_File[0];

		var Old_Setting = await Load_JSON(Current_Setting_File);

		for (const Setting of Object.keys(Old_Setting)) {
			if (Old_Setting[Setting] !== undefined && Current_Setting[Setting] !== undefined) {
				Current_Setting[Setting] = Old_Setting[Setting];
			}
		}

		Replace_Content(Current_Setting_File, JSON.stringify(Current_Setting));
		
	} else {
		Create_File(Setting_File_Name, JSON.stringify(Current_Setting));
	}
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	var AllCommands_Name: string[] = [];

	for (const Name of Object.keys(AllCommands)) {
		AllCommands_Name.push(Name);
	}

	const watcher = vscode.workspace.createFileSystemWatcher('**/src/**/*.lua');

	watcher.onDidCreate(function (File) {
		if (Check_Is_Module_File(File)) {
			Add_Completion(File);
		}
	});

	watcher.onDidDelete(function (File) {
		if (Check_Is_Module_File(File)) {
			Remove_Completion(File);
		}
	});

	async function Run() {
		if (await Check_File_Exists_Workspace(".argon.project.json")) {
			await LoadSetting();
			AllCommands["Load all modules"]();
		} else {
			deactivate();
		}
	}

	Run();

	context.subscriptions.push(
		vscode.commands.registerCommand(`${ExtensionID}.OpenMenu`, () => {
			vscode.window.showQuickPick(AllCommands_Name).then(function (selected: string | undefined) {
				if (selected) {
					AllCommands[selected]();
					vscode.window.showInformationMessage(selected);
				}
			});
		}),
		vscode.commands.registerCommand(`${ExtensionID}.AddModule`, (Module) => {
			Add_Module(Module);
		}),
		watcher,
		vscode.workspace.onDidChangeWorkspaceFolders(function (event) {
			if (event.added) {
				Run();
			}
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {
	Clear_Completion();
}
