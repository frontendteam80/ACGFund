
// src/components/Utilites/Table/Table.jsx
import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Eye, Funnel } from "lucide-react";
import Select from "../DropDown/DropDown.jsx";
import { components } from "react-select";
import "./Table.scss";

function formatCell(value) {
  if (value === null || value === undefined || value === "") return "-";
  return value;
}

// ----- react-select helpers (same as now) -----
const CheckboxOption = (props) => {
  const { label, isSelected } = props;
  return (
    <components.Option {...props}>
      <label className="checkbox-option">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => null}
        />
        <span className="checkbox-option__label">{label}</span>
      </label>
    </components.Option>
  );
};

const NoopMultiValue = () => null;

const CustomValueContainer = (props) => {
  const { children, ...rest } = props;
  const [input] = children;
  return (
    <components.ValueContainer {...rest}>
      {input}
    </components.ValueContainer>
  );
};

const MenuListWithActions = (props) => {
  const { children, selectProps } = props;
  const { isMulti, onClearClick, onDoneClick, selectedCount } = selectProps;

  return (
    <components.MenuList {...props}>
      {children}
      {isMulti && (
        <div className="filter-menu-footer">
          <button
            type="button"
            className="filter-clear-btn"
            onClick={onClearClick}
            disabled={selectedCount === 0}
          >
            Clear
          </button>
          <button
            type="button"
            className="filter-done-btn"
            onClick={onDoneClick}
            disabled={selectedCount === 0}
          >
            Done
          </button>
        </div>
      )}
    </components.MenuList>
  );
};

function FilterDropdown({
  column,
  options,
  value,
  isMulti,
  onChange,
  onClear,
  onDone,
}) {
  const normalizedValue = isMulti ? value || [] : value || null;
  const selectedCount = Array.isArray(normalizedValue)
    ? normalizedValue.length
    : 0;

  return (
    <div className="table-filter-dropdown">
      <Select
        isMulti={isMulti}
        closeMenuOnSelect={!isMulti}
        hideSelectedOptions={false}
        options={options}
        value={normalizedValue}
        onChange={onChange}
        isClearable={false}
        isSearchable
        placeholder={`Filter ${column}`}
        classNamePrefix="table-filter-select"
        menuPlacement="bottom"
        menuPosition="fixed"
        components={
          isMulti
            ? {
                Option: CheckboxOption,
                MultiValue: NoopMultiValue,
                ValueContainer: CustomValueContainer,
                MenuList: MenuListWithActions,
              }
            : undefined
        }
        onClearClick={onClear}
        onDoneClick={onDone}
        selectedCount={selectedCount}
      />
    </div>
  );
}

const columnHelper = createColumnHelper();

/**
 * TanStack-based Table
 */
export default function Table({
  columns = [],
  data = [],
  onDetails,
  showDetailsColumn = false,
  showFilters = false,
  alignMap = {},
  renderValue,
  renderRowActions,
  renderHeader,

  // filter props from parent
  onFilterToggle,
  isFilterActive = {},
  showFilterDropdowns = {},
  columnFilterOptions = {},
  onFilterChange,
  onFilterClear,
  onFilterApply,
}) {
  const safeData = Array.isArray(data) ? data : [];

  // normalize your column config into TanStack column defs
  const columnDefs = React.useMemo(() => {
    return (columns || []).map((col) => {
      const key = typeof col === "string" ? col : col.key;
      const label = typeof col === "string" ? col : col.label ?? col.key;

      return columnHelper.accessor(key, {
        header: () => label,
        cell: (info) => {
          const row = info.row.original;
          const colDef = { key, label };

          if (typeof renderValue === "function") {
            const rendered = renderValue(row, colDef);
            if (rendered === null || rendered === undefined) {
              return formatCell(row?.[key]);
            }
            return rendered;
          }
          return formatCell(row?.[key]);
        },
      });
    });
  }, [columns, renderValue]);

  // add Details column as a display column
  const fullColumnDefs = React.useMemo(() => {
    const base = [...columnDefs];

    if (showDetailsColumn) {
      base.push(
        columnHelper.display({
          id: "__details",
          header: () => "Details",
          cell: (info) => {
            const row = info.row.original;
            return (
              <div className="col-center">
                <button
                  className="details-btn"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDetails && onDetails(row);
                  }}
                  aria-label="View Details"
                >
                  <Eye size={20} color="#486488" />
                </button>
              </div>
            );
          },
        })
      );
    }

    if (renderRowActions) {
      base.push(
        columnHelper.display({
          id: "__actions",
          header: () => "Actions",
          cell: (info) => (
            <div className="col-center">
              {renderRowActions(info.row.original)}
            </div>
          ),
        })
      );
    }

    return base;
  }, [columnDefs, showDetailsColumn, onDetails, renderRowActions]);

  const table = useReactTable({
    data: safeData,
    columns: fullColumnDefs,
    getCoreRowModel: getCoreRowModel(), // basic rows model [web:20][web:23]
  });

  const handleFilterSelect = (columnKey, selected) => {
    if (typeof onFilterChange === "function") {
      onFilterChange(columnKey, selected);
    }
  };

  return (
    <div className="table-container">
      <table className="custom-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const colKey = header.column.id;
                const isMetaCol =
                  colKey === "__details" || colKey === "__actions";

                const align =
                  alignMap[colKey] === "right"
                    ? "col-right"
                    : alignMap[colKey] === "center"
                    ? "col-center"
                    : "";

                // Custom header from parent (only for data columns)
                if (!isMetaCol && typeof renderHeader === "function") {
                  return (
                    <th key={header.id} className={align}>
                      {renderHeader({ key: colKey, label: String(header.column.columnDef.header()) })}
                    </th>
                  );
                }

                // Filterable header for data columns
                if (!isMetaCol && showFilters && onFilterToggle) {
                  const activeValue = Array.isArray(isFilterActive[colKey])
                    ? isFilterActive[colKey]
                    : [];
                  const colOptions = columnFilterOptions[colKey] || [];
                  const isMultiForCol = colOptions.length > 1;

                  return (
                    <th
                      key={header.id}
                      className={`${align} filterable-header`}
                    >
                      <div className="table-header-content">
                        <span className="header-label">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </span>
                        <button
                          className={`filter-toggle-btn ${
                            activeValue.length ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onFilterToggle(colKey);
                          }}
                          type="button"
                          title={`Filter by ${colKey}`}
                        >
                          <Funnel size={16} />
                        </button>
                      </div>

                      {showFilterDropdowns[colKey] &&
                        colOptions.length > 0 && (
                          <div className="table-filter-container">
                            <FilterDropdown
                              column={colKey}
                              options={colOptions}
                              value={activeValue}
                              isMulti={isMultiForCol}
                              onChange={(selected) =>
                                handleFilterSelect(colKey, selected)
                              }
                              onClear={() =>
                                onFilterClear && onFilterClear(colKey)
                              }
                              onDone={() =>
                                onFilterApply && onFilterApply(colKey)
                              }
                            />
                          </div>
                        )}
                    </th>
                  );
                }

                // Normal header (meta or non-filterable)
                return (
                  <th key={header.id} className={align}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => {
                const colKey = cell.column.id;
                const align =
                  alignMap[colKey] === "right"
                    ? "col-right"
                    : alignMap[colKey] === "center"
                    ? "col-center"
                    : "";

                return (
                  <td key={cell.id} className={align}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

