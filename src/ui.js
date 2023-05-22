export class UI {
    static init() {
        const ui = SpreadsheetApp.getUi();
        ui.createAddonMenu()
            .addItem("pickerを表示", "UI.showPicker")
            .addSeparator()
            .addItem("設定", "UI.showSettings")
            .addToUi();
    }
    static alert(message, title = "エラー") {
        const ui = SpreadsheetApp.getUi();
        ui.alert(title, message, ui.ButtonSet.OK);
    }
    static startPrompt() {
        const ui = SpreadsheetApp.getUi();
        const title = "処理対象選択";
        const prompt = "画像が保存されているGoogleDriveのフォルダのURLを入力してください";
        const res = ui.prompt(title, prompt, ui.ButtonSet.OK_CANCEL);
        return res.getResponseText();
    }
    static showSettings() {
        const sidebarTitle = "Settings | Textract";
        const ui = SpreadsheetApp.getUi();
        const htmlOutput = HtmlService.createHtmlOutputFromFile("view/sidebar").setTitle(sidebarTitle);
        ui.showSidebar(htmlOutput);
    }
    static showPicker() {
        const ui = SpreadsheetApp.getUi();
        const html = HtmlService.createHtmlOutputFromFile("view/dialog")
            .setWidth(800)
            .setHeight(600)
            .setSandboxMode(HtmlService.SandboxMode.IFRAME);
        ui.showModalDialog(html, "Simple Textract");
    }
}
