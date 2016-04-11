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
function register_swc_settings() { // whitelist options
	register_setting( 'swc_option1-group', 'SWC Option' );
}
function add_swc_menu() {
	add_menu_page('SWC Plugin Settings', 'SWC Settings', 'administrator', __FILE__, 'swc_plugin_settings_page' , plugins_url('/images/icon.png', __FILE__) );
	add_action( 'admin_init', 'register_swc_settings' );
}
if ( is_admin() ){ // admin actions
	add_action( 'admin_menu', 'add_swc_menu' );
	add_action( 'admin_init', 'register_swc_settings' );
} else {
	// non-admin enqueues, actions, and filters
}
function swc_plugin_settings_page() {
	?>
	<div class="wrap">
		<h2>Shared Workers Cache</h2>

		<form method="post" action="options.php">
			<?php settings_fields( 'swc_option1-group' ); ?>
			<?php do_settings_sections( 'swc_option1-group' ); ?>
			<table class="form-table">
				<tr valign="top">
					<th scope="row">New Option Name</th>
					<td><input type="text" name="new_option_name" value="<?php echo esc_attr( get_option('new_option_name') ); ?>" /></td>
				</tr>

				<tr valign="top">
					<th scope="row">Some Other Option</th>
					<td><input type="text" name="some_other_option" value="<?php echo esc_attr( get_option('some_other_option') ); ?>" /></td>
				</tr>

				<tr valign="top">
					<th scope="row">Options, Etc.</th>
					<td><input type="text" name="option_etc" value="<?php echo esc_attr( get_option('option_etc') ); ?>" /></td>
				</tr>
			</table>

			<?php submit_button(); ?>

		</form>
	</div>
<?php
}
?>