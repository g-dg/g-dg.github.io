"use strict"

var inputSudoku = [];
var calculatedSudoku = [];
var selectedCell = {
	row: 0,
	col: 0
};

// setup function
$(function () {
	// draw initial page
	var body = $("body");
	body.append($("<table id=\"sudoku\">"));
	body.append($("<button>Check</button>").click(check));
	body.append($("<button>Solve</button>").click(solve));
	body.append($("<input id=\"autosolve\" type=\"checkbox\" checked=\"checked\" /><label for=\"autosolve\">Autosolve</label>"));
	body.append("<br>");
	body.append($("<button>Clear Solved</button>").click(clearSolved));
	body.append($("<button>Clear Sudoku</button>").click(clear));
	body.append("<br>");
	body.append($("<button>Import</button>").click(importSudoku));
	body.append($("<button>Export Input</button>").click(exportInputSudoku));
	body.append($("<button>Export Solved</button>").click(exportSolvedSudoku));
	body.append("<br>");
	body.append($("<input id=\"number_input\" type=\"number\" min=\"1\" max=\"9\" step=\"1\" placeholder=\"\">").keypress(keypressHandler));

	// set current value on type
	$(document.body).bind("keypress", keypressHandler);

	// allocate sudoku and draw
	clear();
});

// redraw the sudoku grid
function redraw() {
	var tbody = $("<tbody>");
	$("#sudoku").replaceWith(($("<table id=\"sudoku\" class=\"sudoku\"><thead></thead></table>").append(tbody)));
	for (var i = 0; i < 9; i++) {
		var tr = $("<tr>");
		for (var j = 0; j < 9; j++) {
			var cellLocation = {
				col: j,
				row: i
			};
			var value = calculatedSudoku[cellLocation.row][cellLocation.col];
			var td = $("<td>");
			td.data("location", cellLocation);
			td.html(value == 0 ? "&nbsp;" : value);
			if (inputSudoku[cellLocation.row][cellLocation.col] == 0) td.addClass("calculated");
			if (!checkCell(cellLocation)) td.addClass("error");
			td.click(cellClickHandler);
			if (cellLocation.col == selectedCell.col && cellLocation.row == selectedCell.row) {
				td.addClass("selected");
			}
			tr.append(td);
		}
		tbody.append(tr);
	}
}

// functions for getting the values of a row/column/block
function getRowValues(row) {
	return calculatedSudoku[row];
}

function getColumnValues(col) {
	var resultArray = [];
	for (var i = 0; i < 9; i++) {
		resultArray.push(calculatedSudoku[i][col]);
	}
	return resultArray;
}

function getBlockValues(row, col) {
	var resultArray = [];
	for (var i = row * 3; i < (row * 3 + 3); i++) {
		for (var j = col * 3; j < (col * 3 + 3); j++) {
			resultArray.push(calculatedSudoku[i][j]);
		}
	}
	return resultArray;
}

// functions for finding if a value is in a row/column/block
function inRow(row, value) {
	return (getRowValues(row).indexOf(value) != -1);
}

function inCol(col, value) {
	return (getColumnValues(col).indexOf(value) != -1);
}

function inBlock(row, col, value) {
	return (getBlockValues(row, col).indexOf(value) != -1);
}

// get the number of cells remaining
function cellsRemaining() {
	var count = 0;
	for (var i = 0; i < 9; i++) {
		for (var j = 0; j < 9; j++) {
			if (calculatedSudoku[i][j] == 0) {
				count++;
			}
		}
	}
	return count;
}

// clear button handler
function clear() {
	inputSudoku = [];
	for (var i = 0; i < 9; i++) {
		var sudoku_row = [];
		for (var j = 0; j < 9; j++) {
			sudoku_row.push(0);
		}
		inputSudoku.push(sudoku_row);
	}
	calculatedSudoku = JSON.parse(JSON.stringify(inputSudoku));
	redraw()
}

// clear the solved array
function clearSolved() {
	calculatedSudoku = JSON.parse(JSON.stringify(inputSudoku));
	redraw();
}

// check button click handler
function check() {
	var errorCount = errors();
	if (errorCount == 0) {
		if (cellsRemaining() == 0) {
			alert("The sudoku is correct.");
		} else {
			alert("The partial sudoku is correct.");
		}
	} else {
		alert("There is " + errorCount + " error(s) with the sudoku")
	}
}

// get number of errors
function errors() {
	var errors = 0;
	for (var i = 0; i < 9; i++) {
		for (var j = 0; j < 9; j++) {
			if (!checkCell({
					col: j,
					row: i
				})) {
				errors++;
			}
		}
	}
	return errors;
}

// checks the specified cell
function checkCell(cellLocation) {
	return calculatedSudoku[cellLocation.row][cellLocation.col] == 0 ||
		!(isDuplicateValue(getRowValues(cellLocation.row), calculatedSudoku[cellLocation.row][cellLocation.col]) ||
			isDuplicateValue(getColumnValues(cellLocation.col), calculatedSudoku[cellLocation.row][cellLocation.col]) ||
			isDuplicateValue(getBlockValues(Math.floor(cellLocation.row / 3), Math.floor(cellLocation.col / 3)), calculatedSudoku[cellLocation.row][cellLocation.col]));
}

// solve button handler / autosolve function
function solve() {
	if (errors() == 0) {
		var solved = 0;
		do {
			solved = 0;

			// for each cell, check if only one value can possibly fit in it
			for (var row = 0; row < 9; row++) {
				for (var col = 0; col < 9; col++) {
					var possibilities = [];
					for (var val = 1; val <= 9; val++) {
						if (calculatedSudoku[row][col] == 0 && !inRow(row, val) && !inCol(col, val) && !inBlock(Math.floor(row / 3), Math.floor(col / 3), val)) {
							possibilities.push({
								row,
								col,
								val
							});
						}
					}
					if (possibilities.length == 1) {
						calculatedSudoku[possibilities[0].row][possibilities[0].col] = possibilities[0].val;
						solved++;
					}
				}
			}

			// for each block, check if there is only one place for each value
			for (var blockRow = 0; blockRow < 3; blockRow++) {
				for (var blockCol = 0; blockCol < 3; blockCol++) {
					for (var val = 1; val <= 9; val++) {
						if (!inBlock(blockRow, blockCol, val)) { // check if the value is already in the block
							var possibilities = [];
							for (var row = (blockRow * 3); row < (blockRow * 3 + 3); row++) {
								for (var col = (blockCol * 3); col < (blockCol * 3 + 3); col++) {
									if (calculatedSudoku[row][col] == 0 && !inRow(row, val) && !inCol(col, val)) {
										possibilities.push({
											row,
											col
										});
									}
								}
							}
							if (possibilities.length == 1) {
								calculatedSudoku[possibilities[0].row][possibilities[0].col] = val;
								solved++;
							}
						}
					}

				}
			}

			// for each row, check if there is only one place for each value
			for (var row = 0; row < 9; row++) {
				for (var val = 1; val <= 9; val++) {
					if (!inRow(row, val)) {
						var possibilities = [];
						for (var col = 0; col < 9; col++) {
							if (calculatedSudoku[row][col] == 0 && !inBlock(Math.floor(row / 3), Math.floor(col / 3), val) && !inCol(col, val)) {
								possibilities.push(col);
							}
						}
						if (possibilities.length == 1) {
							calculatedSudoku[row][possibilities[0]] = val;
							solved++;
						}
					}
				}
			}

			// for each column, check if there is only one place for each value
			for (var col = 0; col < 9; col++) {
				for (var val = 1; val <= 9; val++) {
					if (!inCol(col, val)) {
						var possibilities = [];
						for (var row = 0; row < 9; row++) {
							if (calculatedSudoku[row][col] == 0 && !inBlock(Math.floor(row / 3), Math.floor(col / 3), val) && !inRow(row, val)) {
								possibilities.push(row);
							}
						}
						if (possibilities.length == 1) {
							calculatedSudoku[possibilities[0]][col] = val;
							solved++;
						}
					}
				}
			}

		} while (solved > 0);
	}

	redraw();
}

// checks if value is a duplicate in the input array
function isDuplicateValue(inputArray, value) {
	var count = 0;
	for (var i = 0; i < inputArray.length; i++) {
		if (inputArray[i] == value) {
			count++;
			if (count > 1) return true;
		}
	}
	return false;
}

// handles keypresses
function keypressHandler(e) {
	var keyIndex = ["1", "2", "3", "4", "5", "6", "7", "8", "9"].indexOf(e.key)
	if ((keyIndex != -1) && !(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) {
		e.preventDefault();
		e.stopPropagation();
		inputSudoku[selectedCell.row][selectedCell.col] = keyIndex + 1;
		calculatedSudoku = JSON.parse(JSON.stringify(inputSudoku));
		if ($("#autosolve").is(':checked')) solve();
	} else if ((["0", "Backspace", "Clear", "Delete"].indexOf(e.key) != -1) && !(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) {
		e.stopPropagation();
		e.preventDefault();
		inputSudoku[selectedCell.row][selectedCell.col] = 0;
		calculatedSudoku = JSON.parse(JSON.stringify(inputSudoku));
		if ($("#autosolve").is(':checked')) solve();
	} else if ((e.key == "ArrowUp" || e.key == "Up") && !(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) {
		e.preventDefault();
		e.stopPropagation();
		selectedCell.row--;
		if (selectedCell.row < 0) selectedCell.row = 8;
	} else if ((e.key == "ArrowLeft" || e.key == "Left") && !(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) {
		e.preventDefault();
		e.stopPropagation();
		selectedCell.col--;
		if (selectedCell.col < 0) selectedCell.col = 8;
	} else if ((e.key == "ArrowRight" || e.key == "Right") && !(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) {
		e.preventDefault();
		e.stopPropagation();
		selectedCell.col++;
		if (selectedCell.col > 8) selectedCell.col = 0;
	} else if ((e.key == "ArrowDown" || e.key == "Down") && !(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) {
		e.preventDefault();
		e.stopPropagation();
		selectedCell.row++;
		if (selectedCell.row > 8) selectedCell.row = 0;
	}
	/* else if (e.key == "Tab") {
			selectedCell.col++
			if (selectedCell.col >= 9) {
				selectedCell.col = 0;
				selectedCell.row++;
				if (selectedCell.row >= 9) {
					selectedCell = {row: 8, col: 8};
				} else {
					e.stopPropagation();
					e.preventDefault();
				}
			} else {
				e.stopPropagation();
				e.preventDefault();
			}
		}*/
	$("#number_input").val("");
	redraw();
}

// handles cell clicks
function cellClickHandler(e) {
	var newLocation = $(e.target).data("location");
	if (newLocation.col == selectedCell.col && newLocation.row == selectedCell.row) {
		$("#number_input").focus();
	} else {
		selectedCell = newLocation;
		redraw();
	}
}

// import/export functions
function importSudoku() {
	var row = 0;
	var col = 0;
	var ptr = 0;
	var input = prompt();
	if (input !== null) {
		do {
			var valueIndex = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].indexOf(input[ptr]);
			if (valueIndex != -1) {
				inputSudoku[row][col] = valueIndex;
			}
			col++;
			if (col >= 9) {
				col = 0;
				row++;
			}
			ptr++;
		} while (ptr < input.length && row < 9 && col < 9);
	}
	calculatedSudoku = JSON.parse(JSON.stringify(inputSudoku));
	if ($("#autosolve").is(':checked')) solve();
	redraw();
}

function exportInputSudoku() {
	var result = "";
	for (var row = 0; row < 9; row++) {
		for (var col = 0; col < 9; col++) {
			result += inputSudoku[row][col];
		}
	}
	alert(result);
}

function exportSolvedSudoku() {
	solve();
	var result = "";
	for (var row = 0; row < 9; row++) {
		for (var col = 0; col < 9; col++) {
			result += calculatedSudoku[row][col];
		}
	}
	alert(result);
}
