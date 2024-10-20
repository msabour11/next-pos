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
            // options: `Draft\nPaid\nConsolidated\nReturn\nUnpaid`,
            options: `\nDraft\nPaid\nUnpaid\nPaid Consolidated\nUnpaid Consolidated\nPartial Consolidated\nPartial Paid`,

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

    erpnext.PointOfSale.PastOrderList.prototype.refresh_list = function () {
      frappe.dom.freeze();
      this.events.reset_summary();
      const search_term = this.search_field.get_value();
      const custom_status2 = this.status_field.get_value();

      this.$invoices_container.html("");

      return frappe.call({
        method:
          "erpnext.selling.page.point_of_sale.point_of_sale.get_past_order_list",
        freeze: true,
        args: { search_term, custom_status2 },
        callback: (response) => {
          frappe.dom.unfreeze();
          response.message.forEach((invoice) => {
            const invoice_html = this.get_invoice_html(invoice);
            this.$invoices_container.append(invoice_html);
          });
        },
      });
    };
  } else {
    setTimeout(overridePastOrderList, 100);
  }
}
overridePastOrderList();
