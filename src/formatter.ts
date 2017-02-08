import { workspace, window, Disposable, Command, ExtensionContext, Position, Range, Selection, TextEditor, TextEditorEdit, DocumentRangeFormattingEditProvider, TextDocument, FormattingOptions, CancellationToken, TextEdit } from 'vscode';

import { exec, ChildProcess } from 'child_process';
import * as path from 'path';

let fs = require('fs');

let tmpDir = require('os-tmpdir')
// import * as fs from 'fs'; // Can't use this because the typed version does not support a property we need. So we're using the require() method instead.

import { Helper } from './helper';

export class Formatter {
    constructor() { }

    /**
     * Applies the appropriate formats to the active text editor.
     * 
     * @param document TextDocument to format. Edits will be applied to this document.
     * @param selection Range to format. If there is no selection, or the selection is empty, the whole document will be formatted.
     */
    public formatDocument() {
        this.getTextEdits();
    }

    /**
     * Returns a Promise with an array of TextEdits that should be applied when formatting.
     * 
     * @param document TextDocument to format. Edits will be applied to this document.
     * @param selection Range to format. If there is no selection, or the selection is empty, the whole document will be formatted.
     * @return Promise with an array of TextEdit.
     */
    public getTextEdits(): Thenable<TextEdit[]> {
        return new Promise((resolve, reject) => {
            let document: any = window.activeTextEditor.document;

            // Makes our code a little more readable by extracting the config properties into their own variables.
            let config = workspace.getConfiguration('delpan-phpformatter');
            let _pharPath: string = config.get('pharPath', '');
            let _arguments: Array<string> = config.get('arguments', []);
            let _additionalExtensions: Array<string> = config.get('additionalExtensions', []);

            if (document.languageId !== 'php') {
                if (Array.isArray(_additionalExtensions) && _additionalExtensions.indexOf(document.languageId) != -1) {
                    Helper.logDebug('File is in additionalExtensions array, continuing...');
                } else {
                    let message: string = 'This is neither a .php file, nor anything that was set in additionalExtensions. Aborting...';
                    Helper.logDebug(message);
                    return reject(message);
                }
            }

            // Variable args will represent the command string.
            // All the arguments for the command will be appended to the array,
            // so they can later be joined and delimited by spaces more easily.
            let args: Array<string> = ['fix'];
            let filePath: string = path.normalize(document.uri.fsPath);

            // Now let's handle anything related to temp files.
            // TODO: Use document.lineCount to warn user about possibly crashing the editor because of having to write the file contents
            Helper.logDebug('Creating temp file.');

            var editor = window.activeTextEditor;
            if (editor) {
                var selection = editor.selection;
            }

            let prependedPhpTag: boolean = false; // Whether the to-be-fixed content has a '<?php' tag prepended or not. 
            let format_whitespace = 0;
            if (Helper.selectionNotEmpty(selection)) {
                format_whitespace = selection.start.character;
                let current_line = selection.start.line;

                do {
                    let line_info = document.lineAt(current_line);
                    if (line_info.isEmptyOrWhitespace !== false && line_info.text.indexOf('<?') === -1) {
                        break;
                    }

                    current_line--;
                } while (current_line > 0);

                let selectionText: string = document.getText(selection);

                // If the selected text does not have a PHP opening tag, then
                // prepend one manually. Otherwise PHP-CS-Fixer will not do
                // anything at all.

                if (selectionText.indexOf('<?') == -1) {
                    selectionText = '<?php\n' + selectionText;
                    prependedPhpTag = true;
                }

                filePath = tmpDir() + "/phpfmt-phpformat";
                fs.writeFileSync(filePath, selectionText, { encoding: 'utf8' });
            }

            // Make sure to put double quotes around our path, otherwise the command
            // (Symfony, actually) will fail when it encounters paths with spaces in them.
            let escapedPath = Helper.enquote(filePath);

            args.push(escapedPath);

            let fixCommand: string = '';

            // If PHP-CS-Fixer was installed using Composer, and it was added to the PATH,
            // then we don't have to prepend the command with 'php' or point to the .phar file.
            fixCommand = 'php-cs-fixer ' + args.join(' ');

            Helper.logDebug('Full command being executed: ' + fixCommand);
            let stdout: string = '';
            let stderr: string = '';
            let execResult = exec(fixCommand);

            // Output stdout of the fix command result.
            execResult.stdout.on('data', (buffer: string) => {
                stdout += buffer.toString();
            });

            // Output stderr of the fix command result.
            execResult.stderr.on('data', (buffer: string) => {
                stderr += buffer.toString();
            });

            // Handle finishing of the fix command.
            execResult.on('close', (code: any) => {
                if (stdout) {
                    Helper.logDebug('Logging PHP-CS-Fixer command stdout result');
                    Helper.logDebug(stdout);
                }
                if (stderr) {
                    Helper.logDebug('Logging PHP-CS-Fixer command stderr result');
                    Helper.logDebug(stderr);
                }

                if (Helper.selectionNotEmpty(selection)) {
                    // This var will hold the content of the temp file. Every chunk that is read from the ReadStream
                    // will be appended to this var.
                    let fixedContent: string = '';
                    fixedContent = fs.readFileSync(filePath, 'utf8');

                    if (prependedPhpTag) {
                        fixedContent = fixedContent.substring(6);
                    }

                    if (format_whitespace) {
                        let content_arr = fixedContent.split("\n");
                        // content_arr.shift();
                        content_arr.pop();
                        fixedContent = new Array(format_whitespace + 1).join(' ') + content_arr.join("\n" + new Array(format_whitespace + 1).join(' '));
                    }

                    window.activeTextEditor.edit((textEditorEdit: TextEditorEdit) => {
                        textEditorEdit.replace(selection, fixedContent);
                    });

                    return resolve(TextEdit);
                }
            });
        });
    }
}

export class PHPDocumentRangeFormattingEditProvider implements DocumentRangeFormattingEditProvider {
    private formatter: Formatter;

    constructor() {
        this.formatter = new Formatter();
    }

    public provideDocumentRangeFormattingEdits(document: TextDocument, range: Range, options: FormattingOptions, token: CancellationToken): Thenable<TextEdit[]> {
        return this.formatter.getTextEdits();
    }
}