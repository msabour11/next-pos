function overridePOSItemSelector() {
  if (
    typeof erpnext !== "undefined" &&
    typeof erpnext.PointOfSale !== "undefined" &&
    typeof erpnext.PointOfSale.ItemCart !== "undefined"
  ) {
    erpnext.PointOfSale.ItemCart.prototype.init_customer_selector =
      function () {
        this.$component.append(`
   	<div class="customer-group-section"></div>
   	<div class="customer-section"></div>
   `);
        this.$customer_group_section = this.$component.find(
          ".customer-group-section"
        );
        this.$customer_section = this.$component.find(".customer-section");
        this.make_customer_group_selector();
        this.make_customer_selector();
       
       
      };

    erpnext.PointOfSale.ItemCart.prototype.make_customer_group_selector =
      function () {
        this.$customer_group_section.html(`
                    <div class="customer-group-field"></div>
                `);
        const me = this;
        this.customer_group_field = frappe.ui.form.make_control({
          df: {
            label: __("Customer Group"),
            fieldtype: "Link",
            options: "Customer Group",
            placeholder: __("Select Customer Group"),
            onchange: function () {
              me.make_customer_selector(this.value);
            },
          },
          parent: this.$customer_group_section.find(".customer-group-field"),
          render_input: true,
        });
        this.customer_group_field.toggle_label(false);
      };

    erpnext.PointOfSale.ItemCart.prototype.make_customer_selector = function (
      customer_group
    ) {
      this.$customer_section.html(`
      	<div class="customer-field"></div>
      `);
      const me = this;
      let filters = {};
      if (customer_group) {
        filters = {
          customer_group: customer_group,
        };
      }
      this.customer_field = frappe.ui.form.make_control({
        df: {
          label: __("Customer"),
          fieldtype: "Link",
          options: "Customer",
          placeholder: __("Search by customer name, phone, email."),
          get_query: function () {
            return {
              filters: filters,
            };
          },
          onchange: function () {
            if (this.value) {
              const frm = me.events.get_frm();
              frappe.dom.freeze();
              frappe.model.set_value(
                frm.doc.doctype,
                frm.doc.name,
                "customer",
                this.value
              );
              frm.script_manager
                .trigger("customer", frm.doc.doctype, frm.doc.name)
                .then(() => {
                  frappe.run_serially([
                    () => me.fetch_customer_details(this.value),
                    () => me.events.customer_details_updated(me.customer_info),
                    () => me.update_customer_section(),
                    () => me.update_totals_section(),
                    () => frappe.dom.unfreeze(),
                  ]);
                });
            }
          },
        },
        parent: this.$customer_section.find(".customer-field"),
        render_input: true,
      });
      this.customer_field.toggle_label(false);
    };
  } else {
    setTimeout(overridePOSItemSelector, 100);
  }
}
overridePOSItemSelector();
