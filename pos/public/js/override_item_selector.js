function overridePOSCustomerSelector() {
  if (
    typeof erpnext !== "undefined" &&
    typeof erpnext.PointOfSale !== "undefined" &&
    typeof erpnext.PointOfSale.ItemSelector !== "undefined"
  ) {
    /////////////////

    erpnext.PointOfSale.ItemSelector.prototype.get_item_html = function (item) {
      const me = this;
      // eslint-disable-next-line no-unused-vars
      const {
        item_image,
        serial_no,
        batch_no,
        barcode,
        actual_qty,
        uom,
        price_list_rate,
      } = item;
      const precision = flt(price_list_rate, 2) % 1 != 0 ? 2 : 0;
      let indicator_color;
      let qty_to_display;

      let item_style = actual_qty <= 0 ? "pointer-events: none;" : "";
      let image_style =
        actual_qty <= 0 ? "opacity: 0.5; filter: grayscale(100%);" : "";

      // if (item.is_stock_item) {
      // 	indicator_color = actual_qty > 10 ? "green" : actual_qty <= 0 ? "red" : "orange";

      // 	if (Math.round(qty_to_display) > 999) {
      // 		qty_to_display = Math.round(qty_to_display) / 1000;
      // 		qty_to_display = qty_to_display.toFixed(1) + "K";
      // 	}
      // } else {
      // 	indicator_color = "";
      // 	qty_to_display = "";
      // }

      if (item.is_stock_item) {
        // Replace quantity with "Out of Stock" if actual_qty <= 0
        if (actual_qty <= 0) {
          qty_to_display = "Out of Stock";
          indicator_color = "red";
        } else {
          indicator_color = actual_qty > 10 ? "green" : "orange";
          qty_to_display = actual_qty;

          if (Math.round(qty_to_display) > 999) {
            qty_to_display = Math.round(qty_to_display) / 1000;
            qty_to_display = qty_to_display.toFixed(1) + "K";
          }
        }
      } else {
        indicator_color = "";
        qty_to_display = "";
      }

      function get_item_image_html() {
        if (!me.hide_images && item_image) {
          return `<div class="item-qty-pill">
						<span class="indicator-pill whitespace-nowrap ${indicator_color}">${qty_to_display}</span>
					</div>
					<div class="flex items-center justify-center h-32 border-b-grey text-6xl text-grey-100">
						<img
							onerror="cur_pos.item_selector.handle_broken_image(this)"
							class="h-full item-img" style="${image_style}" src="${item_image}"
							alt="${frappe.get_abbr(item.item_name)}"
						>
					</div>`;
        } else {
          return `<div class="item-qty-pill">
						<span class="indicator-pill whitespace-nowrap ${indicator_color}">${qty_to_display}</span>
					</div>
					<div class="item-display abbr">${frappe.get_abbr(item.item_name)}</div>`;
        }
      }

      return `<div class="item-wrapper"
			data-item-code="${escape(item.item_code)}" data-serial-no="${escape(serial_no)}"
			data-batch-no="${escape(batch_no)}" data-uom="${escape(uom)}"
			data-rate="${escape(price_list_rate || 0)}"
			title="${item.item_name}" style="${item_style}">

			${get_item_image_html()}

			<div class="item-detail">
				<div class="item-name">
					${frappe.ellipsis(item.item_name, 18)}
				</div>
				<div class="item-rate">${
          format_currency(price_list_rate, item.currency, precision) || 0
        } / ${uom}</div>
			</div>
		</div>`;
    };
  } else {
    setTimeout(overridePOSCustomerSelector, 100);
  }
}
overridePOSCustomerSelector();
