function overridePastOrderList() {
  if (
    typeof erpnext !== "undefined" &&
    typeof erpnext.PointOfSale !== "undefined" &&
    typeof erpnext.PointOfSale.PastOrderList !== "undefined"
  ) {
    erpnext.PointOfSale.PastOrderList.prototype.make_filter_section =
      function () {
        const me = this;
        this.search_field = frappe.ui.form.make_control({
          df: {
            label: __("Search"),
            fieldtype: "Data",
            placeholder: __("Search by invoice id or customer name"),
          },
          parent: this.$component.find(".search-field"),
          render_input: true,
        });
        this.status_field = frappe.ui.form.make_control({
          df: {
            label: __("Invoice Status"),
            fieldtype: "Select",
            options: `Draft\nPaid\nConsolidated\nReturn\nUnpaid`,
            placeholder: __("Filter by invoice status"),
            onchange: function () {
              if (me.$component.is(":visible")) me.refresh_list();
            },
          },
          parent: this.$component.find(".status-field"),
          render_input: true,
        });
        this.search_field.toggle_label(false);
        this.status_field.toggle_label(false);
        this.status_field.set_value("Draft");
      };
  } else {
    setTimeout(overridePastOrderList, 100);
  }
}
overridePastOrderList();
