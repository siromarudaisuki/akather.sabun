// __________________________________________________________________________________________
// define
class Constants
{
	// 定数値
	static get UNKNOWN_MAGIC_WORD()
	{
		return "('ω')｡o(?)";
	}

	static get TABLE_STATE_CHANGED_EVENT()
	{
		return "tableStateChanged";
	}

	// CSS/DOM セレクタ
	static get Selectors()
	{
		return {
			TABLE: "#table_int",
			ROW_SEPARATOR: ".tr_separate",
			ROW_NORMAL: ".tr_normal",
			TOGGLE_BUTTON: "#toggleRows",
			RESET_BUTTON: "#resetTable",
			TABLE_BUTTONS: ".table-buttons",
			HEADER_ROW: "tr:first td",
			DATA_ROWS: "tr:gt(0)"
		};
	}

	// CSS クラス
	static get Classes()
	{
		return {
			ROW_SEPARATOR: "tr_separate",
			ROW_NORMAL: "tr_normal",
			SORT_ASC: "sort-asc",
			SORT_DESC: "sort-desc",
			TABLE_BUTTONS: "table-buttons",
			SORTABLE_COLUMN: "sortable-column",
			HOVER_TEXT: "text"
		};
	}

	// ボタンテキスト
	static get ButtonTexts()
	{
		return {
			HIDE_SEPARATOR: "区切り行を非表示にする",
			SHOW_SEPARATOR: "区切り行を表示する",
			RESET_TABLE: "元の状態に戻す"
		};
	}

	// URL テンプレート
	static get URLs()
	{
		return {
			BMS_SCORE_VIEWER: "https://bms-score-viewer.pages.dev/view?md5=",
			LR2_IR_RANKING: "http://www.dream-pro.info/~lavalse/LR2IR/search.cgi?mode=ranking&bmsmd5=",
			SABUN_DL: "sabun/★"
		};
	}
}

class TableHeader
{
	constructor(name, sortable = false, inverseSortOrder = false, extractor = null, comparer = null)
	{
		this.name = name;
		this.sortable = sortable;
		this.inverseSortOrder = inverseSortOrder;
		this.extractor = extractor;
		this.comparer = comparer;
	}

	getName()
	{
		return this.name;
	}

	isSortable()
	{
		return this.sortable;
	}

	isInverseSortOrder()
	{
		return this.inverseSortOrder;
	}

	extractValue(obj)
	{
		if (this.extractor)
		{
			return this.extractor(obj);
		}
		return "";
	}

	compare(valueA, valueB, ascending)
	{
		let stateAscending = this.inverseSortOrder ? !ascending : ascending;

		if (this.comparer)
		{
			return this.comparer(valueA, valueB, stateAscending);
		}
		// デフォルト比較
		if (!isNaN(valueA) && !isNaN(valueB))
		{
			return valueA - valueB;
		}
		return valueA.localeCompare(valueB);
	}
}

class TableConfig
{
	static _headers = null; // キャッシュ

	static get HEADERS()
	{
		if (this._headers === null)
		{
			this._headers = [
				new TableHeader(
					"LV",
					true,
					true, // inverse sortorder
					(obj) => obj.level,
					TableConfig._comparerNumericComparer()
				),
				new TableHeader("動画", false),
				new TableHeader("譜面", false),
				new TableHeader(
					"タイトル(IRリンク)",
					true,
					false,
					(obj) => obj.title,
					TableConfig._comparerStrComparer()
				),
				new TableHeader(
					"作者(敬称略) / 本体リンク",
					true,
					false,
					(obj) => obj.artist || "",
					TableConfig._comparerStrComparer()
				),
				new TableHeader("差分", false),
				new TableHeader(
					"BPM",
					true,
					false,
					(obj) => obj.bpm,
					TableConfig._comparerNumericComparer()
				),
				new TableHeader(
					"total(T/N)",
					true,
					false,
					(obj) => obj.total + "/" + obj.totalnote + "/" + (obj.totalnote === 0 ? 0 : (obj.total / obj.totalnote)),
					TableConfig._compareTotalComparer()
				),
				new TableHeader(
					"追加日時",
					true,
					true, // inverse sortorder
					(obj) => obj.year ? (obj.year + "/" + (obj.month || 0) + "/" + (obj.day || 0)) : Constants.UNKNOWN_MAGIC_WORD,
					TableConfig._compareDateComparer()
				),
				new TableHeader(
					"コメント",
					true,
					false,
					(obj) => obj.comment,
					TableConfig._comparerStrComparer()
				)
			];
		}
		return this._headers;
	}

	static _comparerStrComparer()
	{
		return (a, b, asc) => asc ? a.localeCompare(b) : b.localeCompare(a);
	}

	static _comparerNumericComparer()
	{
		return (a, b, asc) =>
			(!isNaN(a) && !isNaN(b)) ?
				(asc ? a - b : b - a)
				:
				(asc ? a.localeCompare(b) : b.localeCompare(a));
	}

	static _compareDateComparer()
	{
		return (valA, valB, ascending) =>
		{
			const unknown = Constants.UNKNOWN_MAGIC_WORD;
			if (valA === unknown) return (valB === unknown) ? 0 : 1; // 両方Unknown or valAがUnknown
			if (valB === unknown) return -1; // valBがUnknown

			const aDateParts = valA.split("/").map(num => parseInt(num) || 0);
			const bDateParts = valB.split("/").map(num => parseInt(num) || 0);
			const minLen = Math.min(aDateParts.length, bDateParts.length);
			for (let i = 0; i < minLen; i++)
			{
				if (aDateParts[i] !== bDateParts[i])
				{
					return ascending ?
						aDateParts[i] - bDateParts[i] :
						bDateParts[i] - aDateParts[i];
				}
			}
			return 0;
		};
	}

	static _compareTotalComparer()
	{
		return (valA, valB, ascending) =>
		{
			// [0]=total
			// [1]=totalnote
			// [2]=T/N
			const valAParts = valA.split("/").map(num => parseFloat(num) || 0);
			const valBParts = valB.split("/").map(num => parseFloat(num) || 0);

			const compareIndex = 2; // T/N で比較
			if (valAParts[compareIndex] === valBParts[compareIndex]) return 0;
			if (isNaN(valAParts[compareIndex])) return ascending ? 1 : -1;
			if (isNaN(valBParts[compareIndex])) return ascending ? -1 : 1;
			return ascending ?
				valAParts[compareIndex] - valBParts[compareIndex] :
				valBParts[compareIndex] - valAParts[compareIndex];
		};
	}

	static getHeaderNames()
	{
		return this.HEADERS.map(h => h.getName());
	}

	static getSortableHeaderNames()
	{
		return this.HEADERS.filter(h => h.isSortable()).map(h => h.getName());
	}

	static isSortable(headerName)
	{
		return this.HEADERS.some(h => h.getName() === headerName && h.isSortable());
	}

	static getHeaderByIndex(index)
	{
		return this.HEADERS[index];
	}

	static getHeaderByName(name)
	{
		return this.HEADERS.find(h => h.getName() === name);
	}
}


// __________________________________________________________________________________________
// view / model / controller

class BMSTableData
{
	constructor(data)
	{
		this.originalData = JSON.parse(JSON.stringify(data));
		this.currentData = JSON.parse(JSON.stringify(data));
	}

	getData()
	{
		return this.currentData;
	}

	getOriginalData()
	{
		return this.originalData;
	}

	reset()
	{
		this.currentData = JSON.parse(JSON.stringify(this.originalData));
	}

	sort(index, ascending)
	{
		const headerObj = TableConfig.getHeaderByIndex(index);
		const rows = this.currentData;

		rows.sort((a, b) =>
		{
			const valueA = headerObj.extractValue(a);
			const valueB = headerObj.extractValue(b);
			return headerObj.compare(valueA, valueB, ascending);
		});

		this.currentData = rows;
	}
}

class BMSTableView
{
	constructor()
	{
		this.$table = $(Constants.Selectors.TABLE);
		this.headers = TableConfig.HEADERS;
		this.sortState = {};
	}

	render(data, symbol, order = null)
	{
		this.$table.html("");

		// header
		{
			const headerRow = $("<tr height='20' style='color:white;background-color:#666666'></tr>");
			this.headers.forEach((headerObj, index) =>
			{
				const headerCell = $("<td align='center'class='" + (headerObj.isSortable() ? "sortable-text" : "notsortable-text") + "'>" + headerObj.getName() + "</td>");

				if (headerObj.isSortable())
				{
					headerCell.attr("sortable", "");
					headerCell.attr("data-index", index);
					headerCell.addClass(Constants.Classes.SORTABLE_COLUMN);
				}

				headerRow.append(headerCell);
			});
			headerRow.appendTo(this.$table);
		}

		// row
		{
			let obj_sep = null;
			let currentLevel = "";
			let count = 0;

			data.forEach((item) =>
			{
				// 区切り行
				if (currentLevel !== item.level)
				{
					if (obj_sep !== null)
					{
						obj_sep.html("<td colspan='11' align='center'><b>" + symbol + " " + currentLevel + " (" + count + "譜面)</b></td>");
					}
					obj_sep = $("<tr class='" + Constants.Classes.ROW_SEPARATOR + "' id='" + symbol + item.level + "'></tr>");
					obj_sep.appendTo(this.$table);
					count = 0;
					currentLevel = item.level;
				}

				// 曲情報
				const row = item.state ? $("<tr class='state" + item.state + "'></tr>") : $("<tr class='" + Constants.Classes.ROW_NORMAL + "'></tr>");
				{
					const urls = Constants.URLs;
					const unknown = Constants.UNKNOWN_MAGIC_WORD;
					$("<td width='1%'>" + symbol + " " + currentLevel + "</td>").appendTo(row);
					$("<td width='1%' align='center'>" + (item.youtube ? "<a href='" + item.youtube + "' target='_blank'><img src='style/youtube.gif' border='0' alt='Youtube' /></a>" : "") + "</td>").appendTo(row);
					$("<td width='1%' align='center'><a href='" + urls.BMS_SCORE_VIEWER + item.md5 + "' target='_blank'>■</a></td>").appendTo(row);
					$("<td width='13%'><a href='" + urls.LR2_IR_RANKING + item.md5 + "' target='_blank'>" + item.title + "</a></td>").appendTo(row);
					$("<td width='5%'>" + (item.artist ? (item.url ? "<a href='" + item.url + "' target='_blank'>" : "") + item.artist + "</a>" : "") + "</td>").appendTo(row);
					$("<td width='1%'>" + ((item.state == 1) ? "" : "<a href='" + urls.SABUN_DL + item.level + " " + item.title + ".zip'>" + "DL" + "</a>") + "</td>").appendTo(row);
					$("<td width='1%'>" + item.bpm + "</td>").appendTo(row);
					$("<td width='1%'>" + item.total + "/" + item.totalnote + "<br/>(T/N=" + ((item.totalnote === 0) ? 0 : (item.total / item.totalnote)).toFixed(4) + ")</td>").appendTo(row);
					$("<td width='1%'>" + (item.year ? (item.year + "/" + (item.month || 0) + "/" + (item.day || 0)) : "<font color='#666666'>" + unknown + "</font>") + "</td>").appendTo(row);
					$("<td width='10%'>" + item.comment + "</td>").appendTo(row);
				}
				row.appendTo(this.$table);
				count++;
			});

			if (obj_sep !== null)
			{
				obj_sep.html("<td colspan='11' align='center'><b>" + symbol + " " + currentLevel + " (" + count + "譜面)</b></td>");
			}
		};
	}

	clear()
	{
		this.$table.html("");
	}

	hideRowSeparators()
	{
		$(Constants.Selectors.ROW_SEPARATOR).hide();
	}

	showRowSeparators()
	{
		$(Constants.Selectors.ROW_SEPARATOR).show();
	}

	toggleRowSeparators()
	{
		$(Constants.Selectors.ROW_SEPARATOR).toggle();
		return $(Constants.Selectors.ROW_SEPARATOR).is(":visible");
	}

	getHeaderCells()
	{
		return this.$table.find(Constants.Selectors.HEADER_ROW);
	}

	setSortIndicator(index, ascending)
	{
		this.sortState[index] = ascending;
		const headerCells = this.getHeaderCells();
		headerCells.each((i, cell) =>
		{
			const $cell = $(cell);

			if (i === index)
			{
				$cell.removeClass(Constants.Classes.SORT_ASC + " " + Constants.Classes.SORT_DESC);
				$cell.addClass(ascending ? Constants.Classes.SORT_ASC : Constants.Classes.SORT_DESC);
			}
			else
			{
				$cell.removeClass(Constants.Classes.SORT_ASC + " " + Constants.Classes.SORT_DESC);
			}
		});
	}

	isSortableColumn(index)
	{
		return this.headers[index].isSortable();
	}

	resetSortIndicators()
	{
		this.sortState = {};
		const headerCells = this.getHeaderCells();
		headerCells.each((i, cell) =>
		{
			const $cell = $(cell);
			$cell.removeClass(Constants.Classes.SORT_ASC + " " + Constants.Classes.SORT_DESC);
		});
	}
}

class BMSTableController
{
	constructor()
	{
		this.view = new BMSTableView();
		this.model = null;
		this.header = null;
		this.sortState = {};

		// UI要素
		this.toggleButton = null;
		this.resetButton = null;
	}

	async initialize(headerJsonPath)
	{
		try
		{
			this.header = await this._loadJSON(headerJsonPath);
			const data = await this._loadJSON(this.header.data_url);
			this.model = new BMSTableData(data);
			this.render();
			this._initializeButtons();
		}
		catch (error)
		{
			console.error("Failed to load data:", error);
		}
	}

	render()
	{
		if (!this.model) return;

		const data = this.model.getData();
		const symbol = this.header.symbol;
		const level = this.header.level;

		this.view.render(data, symbol, level);
		this._attachHeaderClickHandlers();
	}

	reset()
	{
		if (!this.model) return;

		this.model.reset();
		this.sortState = {};
		this.view.resetSortIndicators();
		this.render();

		$(document).trigger(Constants.TABLE_STATE_CHANGED_EVENT, { isSorted: false });
	}

	_loadJSON(url)
	{
		return $.ajax({
			url: url,
			dataType: "json"
		}).promise();
	}

	_initializeButtons()
	{
		const buttonContainer = $("<div class='" + Constants.Classes.TABLE_BUTTONS + "'></div>").insertBefore(Constants.Selectors.TABLE);
		const texts = Constants.ButtonTexts;

		this.toggleButton = $("<button id='toggleRows'>" + texts.HIDE_SEPARATOR + "</button>").appendTo(buttonContainer);
		this.toggleButton.on("click", () =>
		{
			const isVisible = this.view.toggleRowSeparators();
			this.toggleButton.text(isVisible ? texts.HIDE_SEPARATOR : texts.SHOW_SEPARATOR);
		});

		this.resetButton = $("<button id='resetTable'>" + texts.RESET_TABLE + "</button>").appendTo(buttonContainer).hide();
		this.resetButton.on("click", () =>
		{
			this.reset();
			this.toggleButton.show();
			this.resetButton.hide();
		});

		$(document).on(Constants.TABLE_STATE_CHANGED_EVENT, (event, data) =>
		{
			if (data.isSorted)
			{
				this.resetButton.show();
				this.toggleButton.hide();
			}
		});
	}

	_attachHeaderClickHandlers()
	{
		this.view.getHeaderCells().each((index, cell) =>
		{
			const $cell = $(cell);
			if (this.view.isSortableColumn(index))
			{
				$cell.off("click").on("click", () =>
				{
					this.sortState[index] = !this.sortState[index];
					this.model.sort(index, this.sortState[index]);

					this.render();
					this.view.hideRowSeparators();
					this.view.setSortIndicator(index, this.sortState[index]);

					$(document).trigger(Constants.TABLE_STATE_CHANGED_EVENT, { isSorted: true });
				});
			}
		});
	}
}

export { BMSTableController, Constants, TableConfig, TableHeader };