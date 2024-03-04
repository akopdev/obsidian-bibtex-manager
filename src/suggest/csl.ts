import { TextInputSuggest } from "./suggest";
import { cslList, CSLItem } from "./csl-list";

export class CSLSuggest extends TextInputSuggest<CSLItem> {
	getSuggestions(inputStr: string): CSLItem[] {
		const lowerCaseInputStr = inputStr.toLowerCase();
		const items: Array<CSLItem> = [];
		const listItem = cslList.forEach((item: CSLItem) => {
			if (item.label.toLowerCase().contains(lowerCaseInputStr)) {
				items.push(item);
			}
		});

		return items
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
