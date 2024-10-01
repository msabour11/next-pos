function overridePastController() {
  if (
    typeof erpnext !== "undefined" &&
    typeof erpnext.PointOfSale !== "undefined" &&
    typeof erpnext.PointOfSale.Controller !== "undefined"
  ) {
    erpnext.PointOfSale.Controller.prototype.prepare_menu = function () {
      ////

      // Clear existing menu items
      this.page.clear_menu();
      //   $(this.page.btn_primary_menu).hide();
      $(".page-actions .menu-btn-group").hide();

      // Remove any previously added buttons to avoid duplication
      if (this.pos_buttons) {
        this.pos_buttons.forEach((button) => button.remove());
      }
      this.pos_buttons = [];

      // Add individual buttons on the top right
      this.pos_buttons.push(
        this.page.add_button(
          __("Open Form View"),
          this.open_form_view.bind(this),
          {
            icon: "list",
            label: __("Open Form View"),
          }
        )
      );

      this.pos_buttons.push(
        this.page.add_button(
          __("Toggle Recent Orders"),
          this.toggle_recent_order.bind(this),
          {
            icon: "list",
            label: __("Toggle Recent Orders"),
          }
        )
      );

      this.pos_buttons.push(
        this.page.add_button(
          __("Save as Draft"),
          this.save_draft_invoice.bind(this),
          {
            icon: "list",
            label: __("Save as Draft"),
          }
        )
      );

      this.pos_buttons.push(
        this.page.add_button(__("Close the POS"), this.close_pos.bind(this), {
          icon: "close",
          label: __("Close the POS"),
        })
      );

      ///
    };

    /////////////////
    // prepare_menu() {
    // 	// this.page.clear_menu();

    // 	// this.page.add_menu_item(__("Open Form View"), this.open_form_view.bind(this), false, "Ctrl+F");

    // 	// this.page.add_menu_item(
    // 	// 	__("Toggle Recent Orders"),
    // 	// 	this.toggle_recent_order.bind(this),
    // 	// 	false,
    // 	// 	"Ctrl+O"
    // 	// );

    // 	// this.page.add_menu_item(__("Save as Draft"), this.save_draft_invoice.bind(this), false, "Ctrl+S");

    // 	// this.page.add_menu_item(__("Close the POS"), this.close_pos.bind(this), false, "Shift+Ctrl+C");
    // 	///////////////////////hddddddddddddddddddddddddiiiiiiiiiiiiiii///////////////

    // 	////////////////////////////////////////////////////////////

    // 	this.page.clear_menu();

    // 	// Create a container for buttons at the top of the POS
    // 	// const buttonContainer = $(
    // 	// 	'<div class="button-container" style="margin-bottom: 10px;"></div>'
    // 	// ).prependTo(this.wrapper);

    // 	// // Button for Open Form View
    // 	// $('<button class="btn btn-primary">Open Form View</button>')
    // 	// 	.appendTo(buttonContainer)
    // 	// 	.on("click", this.open_form_view.bind(this));

    // 	// // Button for Toggle Recent Orders
    // 	// $('<button class="btn btn-secondary">Toggle Recent Orders</button>')
    // 	// 	.appendTo(buttonContainer)
    // 	// 	.on("click", this.toggle_recent_order.bind(this));

    // 	// // Button for Save as Draft
    // 	// $('<button class="btn btn-warning">Save as Draft</button>')
    // 	// 	.appendTo(buttonContainer)
    // 	// 	.on("click", this.save_draft_invoice.bind(this));

    // 	// // Button for Close the POS
    // 	// $('<button class="btn btn-danger">Close the POS</button>')
    // 	// 	.appendTo(buttonContainer)
    // 	// 	.on("click", this.close_pos.bind(this));
    // 	this.create_button("Open Form View", this.open_form_view.bind(this), "Ctrl+F");
    // 	this.create_button("Toggle Recent Orders", this.toggle_recent_order.bind(this), "Ctrl+O");
    // 	this.create_button("Save as Draft", this.save_draft_invoice.bind(this), "Ctrl+S");
    // 	this.create_button("Close the POS", this.close_pos.bind(this), "Shift+Ctrl+C");
    // }
    // prepare_menu() {
    // 	this.page.clear_menu();

    // 	// Add individual action buttons on the top right
    // 	// this.page.add_action_item(__("Open Form View"), this.open_form_view.bind(this), "Ctrl+F");

    // 	// this.page.add_action_item(__("Toggle Recent Orders"), this.toggle_recent_order.bind(this), "Ctrl+O");

    // 	// this.page.add_action_item(__("Save as Draft"), this.save_draft_invoice.bind(this), "Ctrl+S");

    // 	// this.page.add_action_item(__("Close the POS"), this.close_pos.bind(this), "Shift+Ctrl+C");

    // 	// Add individual buttons on the top right
    // 	this.page.add_button(__("Open Form View"), this.open_form_view.bind(this), {
    // 		icon: "form",
    // 		label: __("Open Form View"),
    // 	});

    // 	this.page.add_button(__("Toggle Recent Orders"), this.toggle_recent_order.bind(this), {
    // 		icon: "list",
    // 		label: __("Toggle Recent Orders"),
    // 	});

    // 	this.page.add_button(__("Save as Draft"), this.save_draft_invoice.bind(this), {
    // 		icon: "save",
    // 		label: __("Save as Draft"),
    // 	});

    // 	this.page.add_button(__("Close the POS"), this.close_pos.bind(this), {
    // 		icon: "close",
    // 		label: __("Close the POS"),
    // 	});
    // }
  } else {
    setTimeout(overridePastController, 100);
  }
}
overridePastController();
