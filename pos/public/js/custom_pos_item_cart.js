function overridePOSItemCart() {
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

        // this.$component.append(`
        //       <div class="customer-container">
        //         <div class="customer-group-section "></div>
        //         <div class="customer-section"></div>
        //       </div>

        //  `);

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

        let filters = {};
        const allowed_customer_group = this.allowed_customer_groups || [];
        filters = {
          name: ["in", allowed_customer_group],
        };
        this.customer_group_field = frappe.ui.form.make_control({
          df: {
            label: __("Customer Group"),
            fieldtype: "Link",
            options: "Customer Group",
            placeholder: __("Select Customer Group"),
            get_query: function () {
              return {
                filters: filters,
              };
            },
            onchange: function () {
              me.test();
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
      const allowed_customer_group = this.allowed_customer_groups || [];

      console.log("allowed_customer_group", allowed_customer_group);
      console.log("customer_group length", allowed_customer_group.length);
      if (customer_group && allowed_customer_group.length > 1) {
        filters = {
          customer_group: customer_group,
        };
      } else if (customer_group && allowed_customer_group.length == 1) {
        filters = {
          customer_group: allowed_customer_group[0],
        };
      } else {
        filters = { customer_group: ["in", allowed_customer_group] };
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
                    // ()=>me.update_total_unpaid(this.value),
                    // () => me.test(),

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
    erpnext.PointOfSale.ItemCart.prototype.toggle_customer_info = function (
      show
    ) {
      if (show) {
        const { customer } = this.customer_info || {};

        this.$cart_container.css("display", "none");
        this.$customer_section.css({
          height: "100%",
          "padding-top": "0px",
        });
        this.$customer_section.find(".customer-details").html(
          `<div class="header">
					<div class="label">${__("Contact Details")}</div>
					<div class="close-details-btn">
						<svg width="32" height="32" viewBox="0 0 14 14" fill="none">
							<path d="M4.93764 4.93759L7.00003 6.99998M9.06243 9.06238L7.00003 6.99998M7.00003 6.99998L4.93764 9.06238L9.06243 4.93759" stroke="#8D99A6"/>
						</svg>
					</div>
				</div>
				<div class="customer-display">
					${this.get_customer_image()}
					<div class="customer-name-desc">
						<div class="customer-name">${customer}</div>
						<div class="customer-desc"></div>
					</div>
				</div>
				<div class="customer-fields-container">
			

				
					<div class="email_id-field"></div>
					<div class="mobile_no-field"></div>
					<div class="loyalty_program-field"></div>
					<div class="loyalty_points-field"></div>


	<div class="total_unpaid-field-container" style="margin-bottom: 10px;">
    <div class="total_unpaid-label" style="font-weight: bold; margin-bottom: 5px;">${__(
      "Total Unpaid"
    )}</div>
    <div class="total_unpaid-field input-xs" 
         style="border: 1px solid var(--gray-300); padding: 5px; border-radius: 6px; background-color: #f9f9f9; font-size: 14px; min-height: 30px; color: #333; opacity: 0.6; pointer-events: none;">0.00</div>
    </div>


	
					 



				</div>
				<div class="transactions-label">${__("Recent Transactions")}</div>`
        );
        // transactions need to be in diff div from sticky elem for scrolling
        this.$customer_section.append(
          `<div class="customer-transactions"></div>`
        );

        this.render_customer_fields();
        this.fetch_customer_transactions();
      } else {
        this.$cart_container.css("display", "flex");
        this.$customer_section.css({
          height: "",
          "padding-top": "",
        });

        this.update_customer_section();
      }
    };

    erpnext.PointOfSale.ItemCart.prototype.update_total_unpaid = function (
      customer
    ) {
      const me = this;

      frappe.call({
        method: "erpnext.accounts.utils.get_balance_on",
        args: {
          party_type: "Customer",
          party: customer,
        },
        callback: function (r) {
          if (r.message) {
            var total = r.message;
            console.log(r.message);
            console.log("dom", me.$component.find(".total_unpaid-field")); // Check if the element is found
            me.$component.find(".total_unpaid-field").text(total);
            console.log("the customer is", customer);
            console.log("the amount is", r.message);
          } else {
          }
        },
      });

      // this.$component.find(".total_unpaid-field").text(value.toFixed(2));
    };

    /// ovrride when choose the customer
    erpnext.PointOfSale.ItemCart.prototype.render_customer_fields =
      function () {
        const $customer_form = this.$customer_section.find(
          ".customer-fields-container"
        );

        const dfs = [
          {
            fieldname: "email_id",
            label: __("Email"),
            fieldtype: "Data",
            options: "email",
            placeholder: __("Enter customer's email"),
          },
          {
            fieldname: "mobile_no",
            label: __("Phone Number"),
            fieldtype: "Data",
            placeholder: __("Enter customer's phone number"),
          },
          {
            fieldname: "loyalty_program",
            label: __("Loyalty Program"),
            fieldtype: "Link",
            options: "Loyalty Program",
            placeholder: __("Select Loyalty Program"),
          },
          {
            fieldname: "loyalty_points",
            label: __("Loyalty Points"),
            fieldtype: "Data",
            read_only: 1,
          },
        ];

        const me = this;
        dfs.forEach((df) => {
          this[`customer_${df.fieldname}_field`] = frappe.ui.form.make_control({
            df: { ...df, onchange: handle_customer_field_change },
            parent: $customer_form.find(`.${df.fieldname}-field`),
            render_input: true,
          });
          this[`customer_${df.fieldname}_field`].set_value(
            this.customer_info[df.fieldname]
          );
        });

        function handle_customer_field_change() {
          const current_value = me.customer_info[this.df.fieldname];
          const current_customer = me.customer_info.customer;

          me.update_total_unpaid(current_customer);
          if (
            this.value &&
            current_value != this.value &&
            this.df.fieldname != "loyalty_points"
          ) {
            frappe.call({
              method:
                "erpnext.selling.page.point_of_sale.point_of_sale.set_customer_info",
              args: {
                fieldname: this.df.fieldname,
                customer: current_customer,
                value: this.value,
              },
              callback: (r) => {
                if (!r.exc) {
                  me.customer_info[this.df.fieldname] = this.value;
                  frappe.show_alert({
                    message: __("Customer contact updated successfully."),
                    indicator: "green",
                  });
                  frappe.utils.play_sound("submit");
                }
              },
            });
          }
        }
      };
  } else {
    setTimeout(overridePOSItemCart, 100);
  }
}
overridePOSItemCart();
