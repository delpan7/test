'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument, languages } from 'vscode';

import { Formatter, PHPDocumentRangeFormattingEditProvider } from './formatter';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "WordCount" is now active!');

    // let wordCounter = new WordCounter();
    // let controller = new WordCounterController(wordCounter);
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = commands.registerCommand('extension.sayHello', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        window.showInformationMessage('Hello World!');

        // wordCounter.updateWordCount();

        var editor = window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }

        var selection = editor.selection;
        var text = editor.document.getText(selection);

        // Display a message box to the user
        window.showInformationMessage('Selected characters: ' + text.length);
    });

    // let format = commands.registerCommand('extension.phpFormat', () => {
    //     let formatter: Formatter = new Formatter();
    //     formatter.formatDocument(window.activeTextEditor.document);
    // });

    // context.subscriptions.push(controller);
    context.subscriptions.push(disposable);
    // context.subscriptions.push(format);
}

class WordCounter {
    private _statusBarItem: StatusBarItem;

    /**
     * updateWordCount
     */
    public updateWordCount() {
        if (!this._statusBarItem) {
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        }

        let editor = window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }

        let doc = editor.document;
        if (doc.languageId === 'markdown') {
            let wordCount = this._getWordCount(doc);

            this._statusBarItem.text = wordCount != 1 ? `$(pencil) ${wordCount} Words` : '$(pencil) 1 Word';
            this._statusBarItem.show();
        } else {
            this._statusBarItem.hide();
        }

    }

    /**
     * test
     */
    public test() {
        console.log("test");
    }
    /**
     * _getWordCount
     */
    public _getWordCount(doc: TextDocument): number {
        let docContent = doc.getText();

        docContent = docContent.replace(/(< ([^>]+)<)/g, '').replace(/\s+/g, ' ');
        docContent = docContent.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        let wordCount = 0;
        if (docContent != '') {
            wordCount = docContent.split(" ").length;
        }

        return wordCount;
    }

    dispose() {
        this._statusBarItem.dispose();
    }
}

class WordCounterController {
    private _wordCounter: WordCounter;
    private _disposable: Disposable;

    constructor(wordCounter: WordCounter) {
        this._wordCounter = wordCounter;
        this._wordCounter.updateWordCount();

        // subscribe to selection change and editor activation events
        let subscriptions: Disposable[] = [];
        window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

        // update the counter for the current file
        // this._wordCounter.updateWordCount();

        // create a combined disposable from both event subscriptions
        this._disposable = Disposable.from(...subscriptions);
    }

    dispose() {
        this._disposable.dispose();
    }

    private _onEvent() {
        this._wordCounter.updateWordCount();
        this._wordCounter.test();
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}
