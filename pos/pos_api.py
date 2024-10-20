
import frappe
from erpnext.accounts.utils import get_balance_on
from frappe.query_builder.functions import IfNull, Sum
from frappe.utils import cint, flt, get_link_to_form, getdate, nowdate
from erpnext.accounts.doctype.payment_entry.payment_entry import get_party_details


# @frappe.whitelist()
# def pos_postpaid(customer=None,name=None,paid_amount=None,reference_name=None):
#     # Retrieve the POS Invoice document
#     doc = frappe.get_doc("POS Invoice", name)
#     paid_amount = float(paid_amount)

#     if doc.outstanding_amount == 0:
#         return 0
#     if doc.status == "Consolidated":
#         add_payment_entry(customer,paid_amount,reference_name)

    
#     # Update the total_net_weight field
#     old_paid = doc.paid_amount
#     doc.paid_amount = paid_amount+old_paid
#     doc.outstanding_amount = doc.grand_total - doc.paid_amount
#     if doc.outstanding_amount == 0:
#         doc.status = "Paid"
    
#     # Update the base_amount field in the payments child table
#     for payment in doc.payments:
#         payment.amount = payment.amount+paid_amount
#         payment.base_amount = payment.amount 
    
#     # Allow changes to the document even if it is submitted
#     doc.flags.ignore_permissions = True
#     doc.flags.ignore_validate_update_after_submit = True
    
#     # Save the document
#     doc.save(ignore_permissions=True)
    
#     # Commit the changes to the database
#     frappe.db.commit()



#     return "hi how are you"



# @frappe.whitelist(allow_guest=True)
# def add_payment_entry(customer,paid_amount,reference_name):
#     # customer_account = get_accounts_details(customer)
   

#     pe=frappe.new_doc("Payment Entry")
#     payment_entry={
#         "party_type":"Customer",
#         "party":customer,
#         "payment_type":"Receive",
#         "mode_of_payment":"Cash",
#         "paid_amount":paid_amount,
#         "received_amount":paid_amount,
#         "paid_from":"Debtors - CD",
#         "paid_to":"Cash - CD",
#         "target_exchange_rate":1,
#         "source_exchange_rate":1,
#         "paid_to_account_currency":"EGP",
#     }
#     #add payments details in payment reference child table
#     pe.update(payment_entry)

#     references = [
#         {
#             "reference_doctype": "Sales Invoice",
#             "reference_name": reference_name,
#             "allocated_amount":paid_amount
#         }
#     ]
#     for reference in references:
#         pe.append("references", {
#             "reference_doctype": reference["reference_doctype"],
#             "reference_name": reference["reference_name"],
#             "allocated_amount": reference["allocated_amount"],

#         })


#     pe.flags.ignore_permissions = True
#     pe.flags.ignore_validate_update_after_submit = True

    

#     pe.save(ignore_permissions=True)


#     pe.submit()
#     frappe.db.commit()
    
# @frappe.whitelist(allow_guest=True)
# def get_total_unpaid_amount(customer):
#     amount= frappe.db.sql(""" select sum(outstanding_amount) from `tabSales Invoice` where customer=%s and docstatus=1 """,(customer,))
#     return amount

# @frappe.whitelist(allow_guest=True)
# def get_accounts_details(customer):
#     res = get_party_details("Page (Demo)","Customer",customer)
#     customer_account = res["party_account"]
#     print("the customer is",customer)

#     # return customer_account
#     return customer_account



############################test consalidate

@frappe.whitelist()
def pos_postpaid(customer=None, name=None, paid_amount=None, reference_name=None, customer_account=None, paid_to=None):
    # Retrieve the POS Invoice document
    doc = frappe.get_doc("POS Invoice", name)
    paid_amount = float(paid_amount)

    # If no outstanding amount, no need to proceed
    if doc.outstanding_amount == 0:
        return 0

    # Update paid amount and outstanding amount
    old_paid = doc.paid_amount
    doc.paid_amount = paid_amount + old_paid
    doc.outstanding_amount = doc.grand_total - doc.paid_amount

    # Consolidated status handling
    if doc.status == "Consolidated":
        add_payment_entry(customer, paid_amount, reference_name, customer_account, paid_to)

        # Update custom status based on outstanding amount
        # doc.custom_status2 = "Paid Consolidated" if doc.outstanding_amount == 0 else "Unpaid Consolidated"
        if doc.outstanding_amount == 0:
            doc.custom_status2 = "Paid Consolidated"
        elif doc.outstanding_amount >0 and doc.outstanding_amount < doc.grand_total:
            doc.custom_status2 = "Partial Consolidated"
        else:
            doc.custom_status2 = "Unpaid Consolidated"

        

    else:
        if doc.outstanding_amount==0:
            doc.custom_status2 = "Paid"
        elif 0 < doc.outstanding_amount < doc.grand_total:
            doc.custom_status2 = "Partial Paid"

        else :
            doc.custom_status2 = "Unpaid"
        

       
       

    # Update the payments child table
    for payment in doc.payments:
        payment.amount += paid_amount
        payment.base_amount = payment.amount

    # Ensure the document can be updated even after submission
    doc.flags.ignore_permissions = True
    doc.flags.ignore_validate_update_after_submit = True

    # Save and commit the document
    doc.save(ignore_permissions=True)
    frappe.db.commit()

    return "Invoice updated successfully"

# def change

@frappe.whitelist(allow_guest=True)
def add_payment_entry(customer, paid_amount, reference_name,customer_account,paid_to):
    # customer_account = get_accounts_details(customer)
    if not customer_account:
        frappe.throw(f"Customer account for {customer} not found")

    pe = frappe.new_doc("Payment Entry")
    payment_entry = {
        "party_type": "Customer",
        "party": customer,
        "payment_type": "Receive",
        "mode_of_payment": "Cash",
        "paid_amount": paid_amount,
        "received_amount": paid_amount,
        "paid_from": customer_account,
        "paid_to":paid_to,
        "target_exchange_rate": 1,
        "source_exchange_rate": 1,
        "paid_to_account_currency": "EGP",
    }
    # Add payments details in payment reference child table
    pe.update(payment_entry)

    references = [
        {
            "reference_doctype": "Sales Invoice",
            "reference_name": reference_name,
            "allocated_amount": paid_amount
        }
    ]
    for reference in references:
        pe.append("references", {
            "reference_doctype": reference["reference_doctype"],
            "reference_name": reference["reference_name"],
            "allocated_amount": reference["allocated_amount"],
        })

    pe.flags.ignore_permissions = True
    pe.flags.ignore_validate_update_after_submit = True

    pe.save(ignore_permissions=True)
    pe.submit()
    frappe.db.commit()

@frappe.whitelist(allow_guest=True)
def get_total_unpaid_amount(customer):
    amount = frappe.db.sql("""SELECT SUM(outstanding_amount) FROM `tabSales Invoice` WHERE customer=%s AND docstatus=1""", (customer,))
    return amount[0][0] if amount else 0

@frappe.whitelist(allow_guest=True)
def get_accounts_details(company,customer):
    res = get_party_details(company, "Customer", customer,date=None)
    # customer="Mohmed"
    if not res:
        frappe.throw(f"Customer {customer} details not found")
    customer_account = res.get("party_account")
    if not customer_account:
        frappe.throw(f"Customer account for {customer} not found")
    return customer_account


@frappe.whitelist()
def change_invoice_status():
    doc = frappe.get_doc("POS Invoice", name)
    if doc.outstanding_amount==0:
        doc.stutus=="Paid"
    elif doc.outstanding_amount >0 and doc.outstanding_amount <doc.grand_total:
        pass
    else:
        doc.stutus=="Unpaid"



# override get_stock_availability bundle
@frappe.whitelist()

def get_pos_reserved_qty_of_bundles(item_code):
    """
    Calculate the total reserved quantity of item get sold in bundles.
    Args:
        item_code (str): The item code for which to calculate the reserved quantity.
    Returns:
        int: The total reserved quantity of item get sold in bundles.
    """

    bundles = frappe.get_all("Product Bundle Item", filters={"item_code": item_code}, fields=["parent", "qty"])

    bundle_quantity_map = {bundle["parent"]: bundle["qty"] for bundle in bundles}

    associated_bundle_names = list(bundle_quantity_map.keys())

    if not associated_bundle_names:
        return 0  

    p_item = frappe.qb.DocType("POS Invoice Item")
    p_inv = frappe.qb.DocType("POS Invoice")

    all_items = (
        frappe.qb.from_(p_inv)
        .from_(p_item)
        .select(p_item.item_code, p_item.qty, p_item.conversion_factor)
        .where(
            (p_inv.name == p_item.parent)&
            (IfNull(p_inv.consolidated_invoice, "") == "") & 
            (p_item.docstatus == 1) &
            (p_inv.docstatus == 1) &
            (p_item.item_code.isin(associated_bundle_names))
        )
    ).run(as_dict=True)

    total_qty = sum(
        item['qty'] * bundle_quantity_map[item['item_code']] * item['conversion_factor']
        for item in all_items
    )

    return total_qty 


@frappe.whitelist()
def get_stock_availability(item_code, warehouse):
   
    
    if frappe.db.get_value("Item", item_code, "is_stock_item"):
        is_stock_item = True
        bin_qty = get_bin_qty(item_code, warehouse)
        pos_sales_qty = get_pos_reserved_qty(item_code, warehouse)
        pos_sales_qty_bundles = get_pos_reserved_qty_of_bundles(item_code)
        return  bin_qty - pos_sales_qty - pos_sales_qty_bundles ,  is_stock_item
        

    else:
        is_stock_item = True
        if frappe.db.exists("Product Bundle", {"name": item_code, "disabled": 0}):
            return get_bundle_availability(item_code, warehouse), is_stock_item
        else:
            is_stock_item = False
            return 0, is_stock_item
            


# helper functions for bundle

def get_bin_qty(item_code, warehouse):
    bin_qty = frappe.db.sql(
        """select actual_qty from `tabBin`
        where item_code = %s and warehouse = %s
        limit 1""",
        (item_code, warehouse),
        as_dict=1,
    )

    return bin_qty[0].actual_qty or 0 if bin_qty else 0

def get_pos_reserved_qty(item_code, warehouse):
    p_inv = frappe.qb.DocType("POS Invoice")
    p_item = frappe.qb.DocType("POS Invoice Item")

    reserved_qty = (
        frappe.qb.from_(p_inv)
        .from_(p_item)
        .select(Sum(p_item.stock_qty).as_("stock_qty"))
        .where(
            (p_inv.name == p_item.parent)
            & (IfNull(p_inv.consolidated_invoice, "") == "")
            & (p_item.docstatus == 1)
            & (p_item.item_code == item_code)
            & (p_item.warehouse == warehouse)
        )
    ).run(as_dict=True)

    return flt(reserved_qty[0].stock_qty) if reserved_qty else 0



def get_bundle_availability(bundle_item_code, warehouse):

    product_bundle = frappe.get_doc("Product Bundle", bundle_item_code)

    bundle_bin_qty = 1000000
    for item in product_bundle.items:
        item_bin_qty = get_bin_qty(item.item_code, warehouse)
        item_pos_reserved_qty = get_pos_reserved_qty(item.item_code, warehouse)
        available_qty = item_bin_qty - item_pos_reserved_qty

        max_available_bundles = available_qty / item.qty
        if bundle_bin_qty > max_available_bundles and frappe.get_value(
            "Item", item.item_code, "is_stock_item"
        ):
            bundle_bin_qty = max_available_bundles

    pos_sales_qty = get_pos_reserved_qty(bundle_item_code, warehouse)
    return bundle_bin_qty - pos_sales_qty



# override get_past_order_list function to change the filter from status to status2

@frappe.whitelist()
def get_past_order_list(search_term, custom_status2, limit=20):
    fields = ["name", "grand_total", "currency", "customer", "posting_time", "posting_date"]
    invoice_list = []

    if search_term and custom_status2:
        invoices_by_customer = frappe.db.get_all(
            "POS Invoice",
            filters={"customer": ["like", f"%{search_term}%"], "custom_status2": custom_status2},
            fields=fields,
            page_length=limit,
        )
        invoices_by_name = frappe.db.get_all(
            "POS Invoice",
            filters={"name": ["like", f"%{search_term}%"], "custom_status2": custom_status2},
            fields=fields,
            page_length=limit,
        )

        invoice_list = invoices_by_customer + invoices_by_name
    elif custom_status2:
        invoice_list = frappe.db.get_all(
            "POS Invoice", filters={"custom_status2": custom_status2}, fields=fields, page_length=limit
        )

    return invoice_list




# change the status2 when closing the shift
@frappe.whitelist()
def change_consalidate_status(close_name):
    # Fetch the POS Closing Entry document
    doc = frappe.get_doc("POS Closing Entry", close_name)
    
    # Loop through the child table 'pos_transactions'
    for pos_transaction in doc.pos_transactions:
        # Get the POS Invoice name from the child table
        pos_invoice_name = pos_transaction.pos_invoice
        
        # Fetch the corresponding POS Invoice document
        pos_invoice_doc = frappe.get_doc("POS Invoice", pos_invoice_name)
        if pos_invoice_doc.outstanding_amount==0:
             pos_invoice_doc.custom_status2 = "Paid Consolidated"
        elif 0 < pos_invoice_doc.outstanding_amount < pos_invoice_doc.grand_total:
            pos_invoice_doc.custom_status2 = "Partial Consolidated"

        else :
            pos_invoice_doc.custom_status2 = "Unpaid Consolidated"


        
        # Change the status2 field in the POS Invoice document
         # Change this to the status you want to set
        
        # Save the changes to the POS Invoice document
        pos_invoice_doc.flags.ignore_permissions = True
        pos_invoice_doc.flags.ignore_validate_update_after_submit = True
        pos_invoice_doc.save(ignore_permissions=True)
        frappe.db.commit()
    
    doc.flags.ignore_permissions = True
    doc.flags.ignore_validate_update_after_submit = True
    
    # Optionally, you can also save the changes to the POS Closing Entry document
    doc.save(ignore_permissions=True)

    # Commit the changes to the database
    frappe.db.commit()







# change pos invoice status on submit

def change_status_on_submit(doc,method):
   
   
    print("from on submit pos invoice")
    # Check the outstanding amount to determine custom status2
    if doc.status == "Consolidated":


        if doc.outstanding_amount==0:
             doc.custom_status2 = "Paid Consolidated"
        elif 0 < doc.outstanding_amount < doc.grand_total:
            doc.custom_status2 = "Partial Consolidated"

        else :
            doc.custom_status2 = "Unpaid Consolidated"
        # Regular POS Invoice status handling
       
        # Update custom status based on outstanding amount
        
    else:

        if doc.outstanding_amount==0:
            doc.custom_status2 = "Paid"
        elif 0 < doc.outstanding_amount < doc.grand_total:
            doc.custom_status2 = "Partial Paid"

        else :
            doc.custom_status2 = "Unpaid"
        # Regular POS Invoice status handling
        # doc.custom_status2 = doc.status
    doc.flags.ignore_permissions = True
    doc.flags.ignore_validate_update_after_submit = True
    
    # Optionally, you can also save the changes to the POS Closing Entry document
    doc.save(ignore_permissions=True)

    # Commit the changes to the database
    frappe.db.commit()




   