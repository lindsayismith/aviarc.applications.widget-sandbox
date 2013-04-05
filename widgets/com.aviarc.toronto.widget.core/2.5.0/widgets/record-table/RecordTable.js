/*global
YAHOO
parseBoolean
getChildNodes
Map
StringTemplate
escapeHTML
*/

(function () {

    YAHOO.namespace("com.aviarc.framework.toronto.widget.core.v2_5_0");
    var Toronto = YAHOO.com.aviarc.framework.toronto;

    // uninlined for IE6
    var _returnFalse = function () {
        return false;
    };

    var _renderCell = function(e) {

        // do nothing if disabled
        if (!this._enabled) {
            return;
        }
        if (e.shiftKey) {
            this._unsort();
        } else {
            var el = YAHOO.util.Event.getTarget(e);
            while (el.tagName.toLowerCase() !== "th") {
                el = el.parentNode;
            }
            this._sort(el.column, el);
        }
    };

    var headerCellTemplate = new StringTemplate('<span class="header-cell-container {@align}"><span class="title">{@text}</span><span class="primary-action-container"><span class="ascending-sort"></span><span class="descending-sort"></span></span><span class="secondary-action-container"></span></span>');
    var renderHeaderCell = function (column) {
        var th = document.createElement('th');
        if (YAHOO.env.ua.ie > 0) { // Ensure text is not selectable in IE. Moz et al use CSS to do this.
            th.onselectstart = _returnFalse;
        }
        th.innerHTML = headerCellTemplate.makeString({
            text: column.attributes.header,
            align: column.attributes['header-align']
        });
        if (!YAHOO.lang.isUndefined(column.attributes.width)) {
            th.style.width = column.attributes.width + "px";
        }
        var clickEvent = this.getWidgetContext().createManagedEvent("RecordTableRow header onclick ManagedEvent (" + column.attributes.header + ")");
        th.onclick = clickEvent.makeDOMEventFunction();
        th.column = column;

        var visible = column.attributes.visible;
        if (!YAHOO.lang.isUndefined(visible) && !parseBoolean(column.attributes.visible)) {
            th.style.display = "none";
        }

        clickEvent.bindHandler(_renderCell, this);
        this._headerTable.appendChild(th);
    };

    // Determine the width of a scrollbar - we need it for a lot of size calculations.
    var determineScrollbarWidth = function () {
        var div = document.createElement("div");
        try {
            div.innerHTML = '<div style="visibility:hidden; padding:0; border:0; position:absolute; width:100px;"><div style="width:auto; height:10px;"><div style="width:auto; overflow-y:scroll; height:100px;"></div></div></div>';
            document.body.appendChild(div);
            return 100 - div.firstChild.firstChild.firstChild.clientWidth;
        } finally {
            document.body.removeChild(div);
        }
    };

    // sort function for dataset rows
    var _datasetRowIndexOrder = function (a, b) {
        a = a.getValue()._datasetRow.getDatasetRowIndex();
        b = b.getValue()._datasetRow.getDatasetRowIndex();
        return a > b ? 1 : -1;
    };

    Toronto.widget.core.v2_5_0.RecordTable = function (columns) {
        this._columns = columns;

        this.onRowSelected = new Toronto.client.Event("onRowSelected");
        this.onDoubleClick = new Toronto.client.Event("onDoubleClick");
        this.onEnabledChanged = new Toronto.client.Event("Record Table onEnabledChanged");
    };

    YAHOO.lang.extend(Toronto.widget.core.v2_5_0.RecordTable, Toronto.framework.DefaultWidgetImpl, {

        startup: function (widgetContext) {
            Toronto.widget.core.v2_5_0.RecordTable.superclass.startup.apply(this, arguments);

            this._bodyTable = this.getNamedElement("body-table");
            this._bodyDiv = this.getNamedElement("body-div");
            this._headerTable = this.getNamedElement("header-table");
            this._fakeScroller = this.getNamedElement("fake-scroller");
            this._fakeScrollerShown = false;
            this._innerContainer = this.getNamedElement("table-container-inner");

            this._disableDiv = this.getNamedElement("disable-div");

            this._enabled = parseBoolean(this.getAttribute('enabled'));

            // This can't be in the constructor - page isn't constructed far enough to use document.body.{appendChild,removeChild}
            this._scrollbarWidth = determineScrollbarWidth();
            // Offset the header by the width of the scrollbar to line up the header columns with the body colums
            if (YAHOO.env.ua.ie !== 6) {
                this.getNamedElement("header").style.right = this._scrollbarWidth + "px";
            }

            // Unfortunate nasty hack.  If all the columns have width attributes, we can end up with multiple scrollbars if table-min-width
            // is set to less than (<total css width of columns> + <scrollbar width> + <column padding/border (see determineTdPadding())>)
            var tableMinWidth = parseInt(this.getAttribute('table-min-width'), 10) || 0;
            var columnTotalWidth = 0;
            for (var ci = 0; ci < this._columns.length; ci ++){
                var column = this._columns[ci];
                columnTotalWidth += parseInt(column.attributes.width, 10) || 0;
            }
            var tdPadding = this._determineTdPadding();
            tableMinWidth = Math.max(tableMinWidth, (columnTotalWidth + this._scrollbarWidth + (tdPadding * this._columns.length)));
            this._innerContainer.style.minWidth = tableMinWidth + "px";

            // Render headers & setup
            this._columns.doLoop(renderHeaderCell, this);
            this._columns.doLoop(this._addConverter, this);
            this._rows = new Map();
            this._currentSort = {};

            this.onDoubleClick.bindHandler(this._doAction, this);

            // Need to re-evaluate the need to show fake scrollbar when made visible (bug 5426)
            this.getWidgetContext().getWidgetNode().onShow.bindHandler(this._parentWidgetResized, this);

            // Look up the widget tree for an onResize event to attach to.  Might be the screen, a window, or nothing
            var widgetNode = widgetContext.getWidgetNode();
            while (!YAHOO.lang.isNull(widgetNode.getParentNode())) {
                widgetNode = widgetNode.getParentNode();
                if (widgetNode.onResize instanceof Toronto.client.Event) {
                    widgetNode.onResize.bindHandler(this._parentWidgetResized, this);
                    break;
                }
            }

            // Attach co-dependent scroll events
            this.fakeScrollerEvent = widgetContext.createManagedEvent("RecordTable onscroll ManagedEvent (fakeScrollerEvent)");
            this.realScrollerEvent = widgetContext.createManagedEvent("RecordTable onscroll ManagedEvent (realScrollerEvent)");
            this._fakeScroller.onscroll = this.fakeScrollerEvent.makeDOMEventFunction();
            this._bodyDiv.onscroll = this.realScrollerEvent.makeDOMEventFunction();
            this.fakeScrollerEvent.bindHandler(this._fkScroller, this);
            this.realScrollerEvent.bindHandler(this._rlScroller, this);

            if (!YAHOO.lang.isUndefined(this.getWidgetContext().getSystem().onUnload)) {
                this.getWidgetContext().getSystem().onUnload.bindHandler(this._cleanup, this);
            }
        },

        _cleanup: function() {
            // clean up the internal map of the rows
            var rows = this._rows.values();
            for (var i = 0; i < rows.length; i += 1) {
                var row = rows[i];
                this._unlinkRowObjects(row, row._tableRow);
            }
            this._rows.clear();

            // clean up the header event handlers and DOM references
            var th = this._headerTable.firstChild;
            while (th !== null) {
                th.onclick = null;
                th.column = null;

                th = th.nextSibling;
            }

            // cleanup DOM element references
            this._bodyTable = null;
            this._bodyDiv = null;
            this._headerTable = null;
            this._fakeScroller = null;
            this._innerContainer = null;
            this._disableDiv = null;
            this._cachedStyledElements = null;
        },

        _addConverter: function (column) {
            var DataConvertorFactory = this.getWidgetContext().getSystem().getDataConvertorFactory();
            column.dataConvertor = DataConvertorFactory.makeDataConvertor(column.attributes);
        },

        /**
         * Attempt to determine how big a cell is.  Rendered size will be requested css size + padding + border
         * ---------------------------------------------
         * |padding|  content          |padding|border|
         * ---------------------------------------------
         * clientWidth returns content+padding
         * offsetWidth returns content+padding+border (most of the time)
         * The browser still does some weird things so this calculation can be off by 2-3px over a ~700px table
         * body set to overflow-x:hidden so the extra few px (will just be border-right from last column) disappear
         * behind the scrollbar, doesn't seem to affect lining up the headers
         */
        _determineTdPadding: function () {
            var div = document.createElement("div");
            try {
                div.innerHTML = '<div style="overflow: visible; position: absolute;" class="com-aviarc-toronto-widget-core_2-5-0_record-table"><div class="record-table-container"><div class="record-table-container-inner"><div class="record-table-body"><div><table><tbody><tr class="row"><td style="width:50px;"></td></tr></tbody></table></div></div></div></div></div>';
                document.body.appendChild(div);
                var cw = div.getElementsByTagName('td')[0].clientWidth;
                var ow = div.getElementsByTagName('td')[0].offsetWidth;
                return (cw - 50) + Math.ceil((ow - cw) * 2.5) + 1;
            } finally {
                document.body.removeChild(div);
            }
        },

        _fkScroller: function () {
            if (YAHOO.env.ua.gecko === 0 || (YAHOO.env.ua.gecko > 0
                    && this._fakeScroller.scrollTop % 5 === 0)) { // In Firefox, only synchronize every 5px
                this.realScrollerEvent.disable();
                this._bodyDiv.scrollTop = this._fakeScroller.scrollTop;
                this.realScrollerEvent.enable();
            }
        },

        _rlScroller: function () {
            if (YAHOO.env.ua.gecko === 0 || (YAHOO.env.ua.gecko > 0
                    && this._bodyDiv.scrollTop % 5 === 0)) { // In Firefox, only synchronize every 5px
                this.fakeScrollerEvent.disable();
                this._fakeScroller.scrollTop = this._bodyDiv.scrollTop;
                this.fakeScrollerEvent.enable();
            }
        },

        _rowCreatedHdlr: function() {
            this._newRow(arguments[0].newCurrentRow);
            if (!YAHOO.lang.isUndefined(this._lastSort)) {
                this.__sort(this._lastSort);
            }
            this._redecorateRows();
            this._setFakeScrollbarHeight();
            this._scrollToCurrentRow();
        },

        _unlinkRowObjects: function (row, tr) {
            row.unBind();
            row.unlink();
            row._recordTable            = null;
            row._columns                = null;
            row._datasetRow             = null;
            row._targetElement          = null;
            row._clickEvent             = null;
            row._tableRow               = null;
            row._cachedStyledElements   = null;
            row._doubleClickEvent       = null;
        },

        _rowDeletedHdlr: function () {
            var row = this._rows.get(arguments[0].oldCurrentRow.getRowID());

            if(!YAHOO.lang.isUndefined(this._currentRow) && this._currentRow.getDatasetRow().getRowID() == arguments[0].oldCurrentRow.getRowID()){
                this._currentRow.unsetCurrentRow();
                delete(this._currentRow);
            }

            this._rows.remove(arguments[0].oldCurrentRow.getRowID());
            this._unlinkRowObjects(row, row._tableRow);
            /*   row._deleteHandler = null;    */
            this._redecorateRows();
            this._setFakeScrollbarHeight();
            this._scrollToCurrentRow();

        },

        _currentRowChanged: function () {
            if (!YAHOO.lang.isUndefined(this._currentRow)) {
                this._currentRow.unsetCurrentRow();
                delete (this._currentRow);
            }
            if (YAHOO.lang.isNull(arguments[0].newCurrentRow)) {
                if (this._ds.getRowCount() === 0) {
                    this._rows.clear();
                }
                return;
            }
            this._currentRow = this._rows.get(arguments[0].newCurrentRow.getRowID());
            if (!YAHOO.lang.isUndefined(this._currentRow)) {
                this._currentRow.setCurrentRow();
            }
            this._scrollToCurrentRow();
        },

        __colHandle: function (args) {
            var row = this._rows.get(args.row.getRowID());
            if (!YAHOO.lang.isNull(row)) {
                row.update();
            }
        },

        _colHandle: function(column){
            this._ds.bindOnRowFieldChangedHandler(column.attributes['display-field'], this.__colHandle, this);
        },

        bind: function (dataContext) {
            Toronto.widget.core.v2_5_0.RecordTable.superclass.bind.apply(this, arguments);

            this._ds = dataContext.findDataset(this.getAttribute('dataset'));

            // Remove row from record-table internals when deleted
            // Row will take care of deleting itself due to <DatasetRow>.onDeleted handler

            this._ds.onRowDeleted.bindHandler(this._rowDeletedHdlr, this);

            this._ds.onRowCreated.bindHandler(this._rowCreatedHdlr, this);

            this._ds.onRowAdded.bindHandler(this.refresh, this);

            this._ds.onContentsReplaced.bindHandler(this.refresh, this);

            // onCurrentRowChanged can indicate change or all rows deleted
            this._ds.onCurrentRowChanged.bindHandler(this._currentRowChanged, this);

            this._ds.onRowCommitActionChanged.bindHandler(this._handleCommitActionChange, this);

            this._columns.doLoop(this._colHandle, this);
        },

        _handleCommitActionChange: function(eventArgs) {
            var oldAction   = eventArgs.oldAction;
            var newAction   = eventArgs.newAction;
            var row         = eventArgs.row;

            var recordTableRow = this._rows.get(row.getRowID());

            // If the dataset row has been marked 'deleted', or 'deleted before commit', remove it from the table
            if (newAction === Toronto.core.DatasetRow.COMMIT_DELETE || newAction === Toronto.core.DatasetRow.COMMIT_DELETED_BEFORE_COMMIT) {
                recordTableRow.unRender();
            }

            // If un-marking a row as 'deleted' or 'deleted before commit', need to re-insert it at its sorted index
            if (oldAction === Toronto.core.DatasetRow.COMMIT_DELETE || oldAction === Toronto.core.DatasetRow.COMMIT_DELETED_BEFORE_COMMIT) {
                var sortedRowIndex = this._findSortedRowIndex(recordTableRow);
                var allRows = this._rows.entrySet();
                // Decrement index by the number of rows preceeding it which are not going to be displayed
                for (var i = 0; i < allRows.length; i += 1) {
                    if (allRows[i].getValue() === recordTableRow) {
                        break;
                    }

                    var commitAction = allRows[i].getValue().getDatasetRow().getCommitAction();
                    if (commitAction === Toronto.core.DatasetRow.COMMIT_DELETE || commitAction === Toronto.core.DatasetRow.COMMIT_DELETED_BEFORE_COMMIT) {
                        sortedRowIndex--;
                    }
                }
                recordTableRow.insertAt(sortedRowIndex);
            }

            // Re-decorate rows, as the odd/even css will be out of whack
            this._redecorateRows();
        },

        _findSortedRowIndex: function(row) {
            var sortedRows = this._rows.values();
            var l = sortedRows.length;
            for (var i=0; i<l; i++) {
                if (sortedRows[i] === row) {
                    return i;
                }
            }

            return -1;
        },

        // Create a new row object, which will render itself into the body of the table
        _newRow: function (dsRow) {
            var row = new Toronto.widget.core.v2_5_0.RecordTable.Row(this._columns, dsRow, this._bodyTable, this);
            this._rows.put(dsRow.getRowID(), row);

            // Don't render rows that are marked for deletion
            if (dsRow.isMarkedDeleted()) {
                return;
            }

            row.render();
        },

        refresh: function () {
            // Store information about the DOM and remove the table body
            var parent = this._bodyTable.parentNode;
            var nextSibling = this._bodyTable.nextSibling;
            parent.removeChild(this._bodyTable);

            var rows = this._rows.values();
            for (var i = 0; i < rows.length; i += 1) {
                var row = rows[i];
                row.unRender();
                this._unlinkRowObjects(row, row._tableRow);
            }
            this._rows = new Map();

            // Row's properties will have been nulled by now, so we don't want unsetCurrentRow to be called on it
            delete(this._currentRow);

            this._ds.getAllRows().doLoop(this._newRow, this);

            if (!YAHOO.lang.isUndefined(this._lastSort)) {
                this.__sort(this._lastSort);
            }
            this._redecorateRows();
            parent.insertBefore(this._bodyTable, nextSibling);

            this._setFakeScrollbarHeight();
            this._parentWidgetResized();

            this._scrollToCurrentRow();
        },

        _setFakeScrollbarHeight: function () {
            this._fakeScroller.firstChild.style.paddingBottom = this._bodyTable.offsetHeight + "px";
        },

        _parentWidgetResized: function () {
            var calculatedScrollbarWidth = (YAHOO.env.ua.ie === 7) ? 0 : this._scrollbarWidth; // IE7 includes scrollbarwidth in offsetWidth
            var undersize = this._innerContainer.parentNode.clientWidth < (this._bodyTable.offsetWidth + calculatedScrollbarWidth);
            if (undersize !== this._fakeScrollerShown) {
                this._fakeScrollerShown = undersize;
                if (undersize) {
                    YAHOO.util.Dom.removeClass(this._fakeScroller, "display-none");
                } else {
                    YAHOO.util.Dom.addClass(this._fakeScroller, "display-none");
                }
            }

            this._setFakeScrollbarHeight();

            // Add extra padding to the body to account for gecko browsers disappearing the scrollbar
            // if there is not enough space to render it
            // See mozilla bug 292284 (https://bugzilla.mozilla.org/show_bug.cgi?id=292284)
            if (YAHOO.env.ua.gecko > 0) {
                var missingVerticalScrollbar =
                    this.getNamedElement('header').clientWidth !==
                    this.getNamedElement('body-div').clientWidth;
                if (missingVerticalScrollbar !== this._scrollbarPaddingAdded) {
                    this._scrollbarPaddingAdded = missingVerticalScrollbar;
                    this.getNamedElement('body-div').style.paddingRight =
                        missingVerticalScrollbar ? this._scrollbarWidth + "px" : "0";
                }
            }

        },

        // Loop over table rows, re-applying css decorations
        _redecorateRows: function () {
            var isEven = false;
            var dsCurrentRow = this._ds.getCurrentRow();

            var rows = this._rows.values();
            var len = rows.length;
            for (var i=0; i<len; i++) {
                var row = rows[i];

                // Don't CSS format rows that are marked for deletion
                if (row._datasetRow.isMarkedDeleted()) {
                    continue;
                }


                row.resetClass();
                if (isEven) {
                    row.addClass('even');
                }
                if (dsCurrentRow !== null && dsCurrentRow.getRowID() === row._datasetRow.getRowID()) {
                    row.addClass('current');
                    this._currentRow = row;
                }
                isEven = !isEven;
            }
        },

        // Most of this is copied from the button
        _doAction: function () {
            var action = this.getAttribute('on-double-click');
            if (!YAHOO.lang.isUndefined(action) && this._enabled) {
                var noValidateActions = [
                    "Restart",
                    "Cancel"
                ];
                if (parseBoolean(this.getAttribute('validate')) && !noValidateActions.contains(action)) {
                    // Validate from the root of our context
                    var results = this.getWidgetContext().getWidgetNode().getWidgetTree().validate();

                    // Uses the toString method of each InvalidWidgetNodeInfo
                    if (results.length > 0) {
                        alert("The following must be corrected before proceeding:\n\n" + results.join("\n"));
                        return;
                    }
                }
                this._widgetContext.getSystem().submitScreen({
                    action: action
                });
            }
        },

        // Using the sorting mechanism in the map backing the rows table, sort the table rows
        __sort: function (comparator) {
            this._rows.sort(comparator);
            // re-append the <tr>'s to the table to re-order them
            this._rows.values().doLoop(function (row) {
                if (!row._datasetRow.isMarkedDeleted()) {
                    row.reinsert(); // Don't insert rows that are marked deleted
                }
            });
            this._lastSort = comparator;
            this._redecorateRows();
            this._scrollToCurrentRow();
        },

        // sort by one of the table columns
        _sort: function (column, headerCell) {
            if (!parseBoolean(column.attributes['allow-sort'])) {
                return;
            }
            var ascending = column !== this._currentSort.column || !this._currentSort.ascending;
            var fieldName = column.attributes['display-field'];
            var useFieldFormatter = (column.attributes.datatype == "none") ? true : false;
            var comparator = column.dataConvertor.compare;
            this.__sort(function (a, b) {
                var aValue = a.getValue()._datasetRow.getField(fieldName);
                var bValue = b.getValue()._datasetRow.getField(fieldName);

                // Only use the field formatter comparison if no datatype associated with column
                if (useFieldFormatter) {
                    // Use the compare method from the first row of the two (they should all be the same anyways)
                    var fieldFormatter = a.getValue()._datasetRow.getFieldObject(fieldName).getMetadata().getFieldFormatter();
                    if (fieldFormatter !== null && !YAHOO.lang.isUndefined(fieldFormatter.compareValues)) {
                        return (ascending ? 1 : -1) * fieldFormatter.compareValues(aValue, bValue);
                    }
                }
                return (ascending ? 1 : -1) * comparator(aValue, bValue);
            });

            if (!YAHOO.lang.isUndefined(this._currentSort.headerCell)) {
                this._currentSort.headerCell.className = "";
            }
            headerCell.className = ascending ? "sort-column-ascending" : "sort-column-descending";
            this._currentSort = {
                column: column,
                headerCell: headerCell,
                ascending: ascending
            };
        },

        // Sort in dataset row order
        _unsort: function () {
            this.__sort(_datasetRowIndexOrder);
            if (!YAHOO.lang.isUndefined(this._currentSort.headerCell)) {
                this._currentSort.headerCell.className = "";
            }
            this._currentSort = {};
        },

        // Scroll the table so the current row is somewhere in view
        _scrollToCurrentRow: function () {
            if (YAHOO.lang.isUndefined(this._currentRow) || YAHOO.lang.isNull(this._currentRow)) {
                return;
            }

            if (YAHOO.lang.isUndefined(this._currentRow._tableRow) || YAHOO.lang.isNull(this._currentRow._tableRow)) {
                return;
            }

            if (this._bodyTable.parentNode === null){
                return;
            }

            var rowOffset = this._currentRow._tableRow.offsetTop;
            var rowHeight = this._currentRow._tableRow.clientHeight;
            var tableOffset = this._bodyDiv.scrollTop;
            var viewportHeight = this._bodyDiv.clientHeight;

            var tableHeight = this._bodyTable.parentNode.clientHeight;

            // If the row is not already in view, scroll it into view (to the middle if there is sufficient room to move)
            if ((rowOffset < tableOffset) || ((rowOffset + rowHeight) > (tableOffset + viewportHeight))) {
                this._bodyDiv.scrollTop = Math.max(0, Math.min(tableHeight, (rowOffset - 0.5 * (viewportHeight - rowHeight))));
            }
        },

        _enabledChanged: function() {
            YAHOO.util.Dom[this._enabled ? "addClass": "removeClass"](this._disableDiv, "display-none");
            this.onEnabledChanged.fireEvent({
                widget: this.getWidgetContext().getWidgetNode(),
                enabled: this._enabled
            });
        },

        setEnabled: function(enabled) {
            var newEnabled = parseBoolean(enabled);
            if (newEnabled !== this._enabled) {
                this._enabled = newEnabled;
                this._enabledChanged();
            }
        },

        getEnabled: function() {
            return this._enabled;
        }
    });


    Toronto.widget.core.v2_5_0.RecordTable.Row = function (columns, datasetRow, targetElement, recordTable) {
        this._columns = columns;
        this._datasetRow = datasetRow;


        this._targetElement = targetElement;
        this._recordTable = recordTable;
        this._isRendered = false;
    };

    Toronto.widget.core.v2_5_0.RecordTable.Row.prototype = {
        _rowClicked: function () {
            // don't change current row if disabled
            if (!this._recordTable._enabled)
                return;

            this._datasetRow.makeCurrentRow();
            this._recordTable.onRowSelected.fireEvent({
                widget: this._recordTable.getWidgetContext().getWidgetNode(),
                datasetRow: this._datasetRow
            });
        },

        _doubleClickBind: function () {
            this._recordTable.onDoubleClick.fireEvent({
                widget: this._recordTable.getWidgetContext().getWidgetNode(),
                datasetRow: this._datasetRow
            });
        },

        getDatasetRow : function(){
            return this._datasetRow;
        },

        render: function () {
            if (this._isRendered) {
                return;
            }

            this._tableRow = document.createElement('tr');
            this._tableRow.className = "row";
            this._tableRow.RecordTableRow = this;
            this._tableRow.DatasetRow = this._datasetRow;
            this._tableRow.DatasetRowIndex = this._datasetRow.getDatasetRowIndex();
            this._targetElement.appendChild(this._tableRow);

            this._clickEvent = this._recordTable.getWidgetContext().createManagedEvent("RecordTable onclick ManagedEvent");
            this._tableRow.onclick = this._clickEvent.makeDOMEventFunction();
            this._clickEvent.bindHandler(this._rowClicked, this);

            this._doubleClickEvent = this._recordTable.getWidgetContext().createManagedEvent("RecordTable ondblclick ManagedEvent");
            this._tableRow.ondblclick = this._doubleClickEvent.makeDOMEventFunction();
            this._doubleClickEvent.bindHandler(this._doubleClickBind, this);

            this._validHandler = this._datasetRow.getMetadata().onValidChanged.bindHandler(function(args){
                                    this._onValidChanged(args);
                                    }, this);

            this.update();

            this._deleteHandler = this._datasetRow.onDeleted.bindHandler(this.unRender, this);
            this._isRendered = true;
        },

        update: function () {
            while (!YAHOO.lang.isNull(this._tableRow.firstChild)) {
                this._tableRow.removeChild(this._tableRow.firstChild);
            }
            var len = this._columns.length;
            for (var i = 0; i < len; i += 1) {
                var column = this._columns[i];
                var attr = {};
                var field = this._datasetRow.getFieldObject(column.attributes['display-field']);
                var text = field.getValue();

                if (YAHOO.lang.isNull(text) || YAHOO.lang.isUndefined(text) || text === "") {
                    text = "\u00a0"; //nbsp - stops row collapsing
                } else if( column.attributes.datatype == "none") {
                    text = field.getFormattedValue();
                }else{
                    text = column.dataConvertor.formatValue(text);
                }

                var td = document.createElement('td');
                if (YAHOO.env.ua.ie > 0) { // Ensure text is not selectable in IE. Moz et al use CSS to do this.
                    td.onselectstart = _returnFalse;
                }
                td.appendChild(document.createTextNode(text));
                if (!YAHOO.lang.isUndefined(column.attributes.width)) {
                    td.style.width = column.attributes.width + "px";
                }
                if (!YAHOO.lang.isUndefined(column.attributes.align)){
                    td.align = column.attributes.align;
                }

                var visible = column.attributes.visible;
                if (!YAHOO.lang.isUndefined(visible) && !parseBoolean(column.attributes.visible)) {
                    td.style.display = "none";
                }


                this._tableRow.appendChild(td);
            }
            this._validState = this._datasetRow.getMetadata().isValid();
            this._setValid();

        },

        _onValidChanged : function(args){
            this._validState = args.newValue;
            this._setValid();
        },

        _setValid : function(){
            if(this._validState){
                this.removeClass("invalid");
            }else {
                this.addClass("invalid");
            }
        },


        unRender: function () {
            if (this._isRendered) {
                this._targetElement.removeChild(this._tableRow);
            }
            this._isRendered = false;
        },

        unBind: function () {
            if (this._isRendered) {
                this._deleteHandler.unbind();
                if(this._validHandler !== null){
                    this._validHandler.unbind();
                    this._validHandler = null;

                }
            }
        },

        unlink: function () {
            if (this._isRendered) {
                this._tableRow.onclick = null;
                this._tableRow.ondblclick = null;
                this._tableRow.DatasetRow = null;
                this._tableRow.DatasetRowIndex = null;
                this._tableRow.RecordTableRow = null;
            }
        },

        getStyledElements: function () {
            return [
                this._tableRow
            ];
        },

        setCurrentRow: function () {
            this.addClass("current");
        },

        unsetCurrentRow: function () {
            this.removeClass("current");
        },

        resetClass: function () {
            this._tableRow.className = "row";
            if( ! this._validState){
                this.addClass("invalid");
            }
        },

        reinsert: function () {
            this._targetElement.appendChild(this._tableRow);
        },

        // Insert this row at a particular index in the table
        insertAt: function(index) {
            this.render();
            var trs = this._targetElement.getElementsByTagName("tr");
            if (trs.length > 0 && index < trs.length) {
                var nextSibling = trs[index];
                this._targetElement.insertBefore(this._tableRow, nextSibling);
            } else {
                this.reinsert();
            }
        }
    };

    YAHOO.lang.augmentProto(Toronto.widget.core.v2_5_0.RecordTable.Row, Toronto.util.CssUtils);
})();
