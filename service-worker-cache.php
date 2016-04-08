<?php
/**
 * Plugin Name: Service Worker Cache
 * Plugin URI: https://github.com/miguelcalderon/wordpress-swc-plugin
 * Description: Service Worker Cache
 * Version: 1.0
 * Author: Miguel Calderón
 * Author URI: https://github.com/miguelcalderon
 * License: GPL2
 * Copyright 2016 Miguel Calderón

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License, version 2, as
published by the Free Software Foundation.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */
if (!function_exists('is_admin')) {
	header('Status: 403 Forbidden');
	header('HTTP/1.1 403 Forbidden');
	exit();
}
defined('ABSPATH') or die("No script kiddies please!");
define( 'SERVICE_WORKER_CACHE_VERSION', '1.0' );
define( 'SERVICE_WORKER_CACHE_RELEASE_DATE', date_i18n( 'F j, Y' ) );
define( 'SERVICE_WORKER_CACHE_DIR', plugin_dir_path( __FILE__ ) );
define( 'SERVICE_WORKER_CACHE_URL', plugin_dir_url( __FILE__ ) );

function activate_service_worker_cache() {
	exec('ln -s '.plugin_dir_path( __FILE__ ).'service-worker-cache.js '.get_home_path().'serviceWorker.js');
}
register_activation_hook( __FILE__, 'activate_service_worker_cache' );
function deactivate_service_worker_cache() {
	exec('unlink '.get_home_path().'serviceWorker.js');
}
register_deactivation_hook( __FILE__, 'deactivate_service_worker_cache' );

function add_service_worker_cache() {
	?>
	<script>
		console.log('Registering service worker.');
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/serviceWorker.js', {
				scope: '/'
			}).then(function(reg) {
				// registration worked
				console.log('Registration succeeded. Scope is ' + reg.scope);
			}).catch(function(error) {
				// registration failed
				console.log('Registration failed with ' + error);
			});
		}
	</script>
	<?php
}
add_service_worker_cache();
?>