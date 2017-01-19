=== MC Service Worker Cache ===
Contributors: miguelcalderon
Tags: service worker cache
Requires at least: 4.5
Tested up to: 4.7.1
Stable tag: 4.7.1
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Experimental Basic implementation of service worker cache for Wordpress.

== Description ==
Experimental Basic implementation of service worker cache for Wordpress. Once activated you need to choose which file types it should cache: images, CSS, JavaScript and/or the rest. Wp-admin and preview asset requests are never cached. It relies on HTTP request's "Accept" header to determine the type of resource requested, and will use the first recognized mime type entry in the header.

It needs to modify .htaccess to work, therefore it will only work on Apache setups with modifiable root .htaccess.

= Docs & Support =
Issues on https://github.com/miguelcalderon/wordpress-swc-plugin.

= Features: =

* Service Worker Cache.
