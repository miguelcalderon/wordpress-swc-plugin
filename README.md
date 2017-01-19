# wordpress-swc-plugin
Experimental Basic implementation of service worker cache for Wordpress. Once activated you need to choose which file types it should cache: images, CSS, JavaScript and/or the rest. Wp-admin and preview asset requests are never cached. It relies on HTTP request's "Accept" header to determine the type of resource requested, and will use the first recognized mime type entry in the header.

It needs to modify .htaccess to work, therefore it will only work on Apache setups with modifiable root .htaccess.
