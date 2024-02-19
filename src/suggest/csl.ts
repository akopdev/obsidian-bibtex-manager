import { TextInputSuggest } from "./suggest";
import { cslList, CSLItem } from "../utils";

export class CSLSuggest extends TextInputSuggest<string> {
	getSuggestions(inputStr: string): CSLItem[] {
		const lowerCaseInputStr = inputStr.toLowerCase();
		const listItem = cslList.filter((item: CSLItem) => item.label.toLowerCase().contains(lowerCaseInputStr))
		return listItem
	}

	renderSuggestion(item: CSLItem, el: HTMLElement): void {
		el.setText(item.label);
	}

	selectSuggestion(item: CSLItem): void {
		this.inputEl.value = item.id;
		this.inputEl.trigger("input");
		this.close();
	}
}
