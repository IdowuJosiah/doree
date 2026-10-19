-- One-time cleanup before Dorée adds her own inventory.
-- Paste the whole file into a new SQL editor tab with nothing highlighted,
-- then Run. Run it BEFORE adding real products: it removes every product.
--
-- Removes:  every product (with its sizes, photos, collection links and
--           wishlist entries), and every order that is Pending or Cancelled
--           (abandoned checkouts and the test orders).
-- Keeps:    Paid and Fulfilled orders, the four collections and their
--           banners/covers, site content, shipping settings, messages,
--           subscribers and customer accounts.
--
-- Photo files stay in Storage; delete the "products" and "originals/products"
-- folders under Storage > media if you want the space back.

begin;

delete from public.orders where status in ('pending', 'cancelled');
delete from public.products;

commit;

select
  (select count(*) from public.products) as products_left,
  (select count(*) from public.orders) as orders_left,
  (select count(*) from public.collections) as collections_kept;
