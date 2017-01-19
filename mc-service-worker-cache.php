<?php
/**
 * Plugin Name: MC Service Worker Cache
 * Plugin URI: https://github.com/miguelcalderon/wordpress-swc-plugin
 * Description: Experimental Basic implementation of service worker cache for Wordpress. Once activated you need to choose which file types it should cache: images, CSS, JavaScript and/or the rest. Wp-admin and preview asset requests are never cached. It relies on HTTP request's "Accept" header to determine the type of resource requested, and will use the first recognized mime type entry in the header. It needs to modify .htaccess to work, therefore it will only work on Apache setups with modifiable root .htaccess.
 * Version: 0.2.5
 * Author: Miguel Calderón
 * Author URI: https://github.com/miguelcalderon/wordpress-swc-plugin
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
define( 'MC_SERVICE_WORKER_CACHE_VERSION', '1.0' );
define( 'MC_SERVICE_WORKER_CACHE_RELEASE_DATE', date_i18n( 'F j, Y' ) );
define( 'MC_SERVICE_WORKER_CACHE_DIR', plugin_dir_path( __FILE__ ) );
define( 'MC_SERVICE_WORKER_CACHE_URL', plugin_dir_url( __FILE__ ) );

function refresh_rewrite_rules() {
	global $wp_rewrite;
	$wp_rewrite->flush_rules();
}
function add_mc_swc_rewrite($rules) {
	return str_replace('RewriteBase /', 'RewriteBase /'."\n".'RewriteRule ^serviceWorker.js$ '.str_replace(site_url(), '', plugin_dir_url( __FILE__ )).'service-worker-cache.js [PT,L]', $rules);
}
function remove_mc_swc_rewrite($rules) {
	return str_replace("\n".'RewriteRule ^serviceWorker.js$ '.str_replace(site_url(), '', plugin_dir_url( __FILE__ )).'service-worker-cache.js [PT,L]', '', $rules);
}
function activate_mc_service_worker_cache() {
	/*
	if (!copy(plugin_dir_path (__FILE__).'service-worker-cache.js', get_home_path().'serviceWorker.js')) {
		echo ("failed to copy service-worker-cache.js...");
	}
	*/
	add_filter('mod_rewrite_rules', 'add_mc_swc_rewrite');
	refresh_rewrite_rules();
}
register_activation_hook(__FILE__, 'activate_mc_service_worker_cache');
function deactivate_mc_service_worker_cache() {
	/*
	unlink(get_home_path().'serviceWorker.js');
	*/
	add_filter('mod_rewrite_rules', 'remove_mc_swc_rewrite');
	refresh_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'deactivate_mc_service_worker_cache');

function add_mc_service_worker_cache() {
	$url = plugins_url('mc-service-worker-cache');
	wp_enqueue_script('mc_swc_registration_placeholder', $url.'/mc_swc_registration_placeholder.js', array());
	wp_localize_script( 'mc_swc_registration_placeholder', 'mc_service_worker_cache', array('ajax_url' => admin_url( 'admin-ajax.php' ), 'nonce' => wp_create_nonce( 'getsettings' ), 'plugin_url' => $url ));
}
function register_mc_swc_settings() {
	register_setting( 'mc_swc_option1-group', 'cache_images' );
	register_setting( 'mc_swc_option1-group', 'cache_css' );
	register_setting( 'mc_swc_option1-group', 'cache_js' );
	register_setting( 'mc_swc_option1-group', 'cache_other' );
}
function add_mc_swc_menu() {
	add_menu_page('MC SWC Plugin Settings', 'MC SWC Settings', 'administrator', __FILE__, 'mc_swc_plugin_settings_page' , 'dashicons-controls-forward' );
	add_action('admin_init', 'register_mc_swc_settings');
}
if (is_admin()) {
	add_action('admin_menu', 'add_mc_swc_menu');
} else {
	add_action( 'get_footer', 'add_mc_service_worker_cache' );
}
function create_section_for_radio($value) {
	create_opening_tag($value);
	foreach ($value['options'] as $option_value => $option_text) {
		$checked = ' ';
		if (get_option($value['id']) == $option_value) {
			$checked = ' checked="checked" ';
		}
		else if (get_option($value['id']) === FALSE && $value['std'] == $option_value){
			$checked = ' checked="checked" ';
		}
		else {
			$checked = ' ';
		}
		echo '<div class="mnt-radio"><input type="radio" name="'.$value['id'].'" value="'.
		     $option_value.'" '.$checked."/>".$option_text."</div>\n";
	}
	create_closing_tag($value);
}

function mc_swc_plugin_settings_page() {
	$checked_images_yes = esc_attr( get_option('cache_images') ) == 'yes' ? ' checked' : '';
	$checked_images_no = esc_attr( get_option('cache_images') ) == 'no' ? ' checked' : '';
	$checked_css_yes = esc_attr( get_option('cache_css') ) == 'yes' ? ' checked' : '';
	$checked_css_no = esc_attr( get_option('cache_css') ) == 'no' ? ' checked' : '';
	$checked_js_yes = esc_attr( get_option('cache_js') ) == 'yes' ? ' checked' : '';
	$checked_js_no = esc_attr( get_option('cache_js') ) == 'no' ? ' checked' : '';
	$checked_other_yes = esc_attr( get_option('cache_images') ) == 'yes' ? ' checked' : '';
	$checked_other_no = esc_attr( get_option('cache_images') ) == 'no' ? ' checked' : '';
	?>
    <div class="wrap">
        <h2>Service Worker Cache</h2>
        <form method="post" action="/wp-admin/options.php">
			<?php settings_fields( 'mc_swc_option1-group' ); ?>
			<?php do_settings_sections( 'mc_swc_option1-group' ); ?>
            <table class="form-table">
                <tr valign="top">
                    <th scope="row">Cache images</th>
                    <td><label>Yes <input type="radio" name="cache_images" value="yes" <?php echo $checked_images_yes; ?>></label><label>No <input type="radio" name="cache_images" value="no" <?php echo $checked_images_no; ?>></label></td>
                </tr>
                <tr valign="top">
                    <th scope="row">Cache CSS</th>
                    <td><label>Yes <input type="radio" name="cache_css" value="yes" <?php echo $checked_css_yes; ?>></label><label>No <input type="radio" name="cache_css" value="no" <?php echo $checked_css_no; ?>></label></td>
                </tr>
                <tr valign="top">
                    <th scope="row">Cache JavaScript</th>
                    <td><label>Yes <input type="radio" name="cache_js" value="yes" <?php echo $checked_js_yes; ?>></label><label>No <input type="radio" name="cache_js" value="no" <?php echo $checked_js_no; ?>></label></td>
                </tr>
                <tr valign="top">
                    <th scope="row">Cache other</th>
                    <td><label>Yes <input type="radio" name="cache_other" value="yes" <?php echo $checked_other_yes; ?>></label><label>No <input type="radio" name="cache_other" value="no" <?php echo $checked_other_no; ?>></label></td>
                </tr>
            </table>
			<?php submit_button(); ?>
        </form>
    </div>
	<?php
}

add_action( 'wp_ajax_getsettings', 'mc_swc_get_settings' );
add_action( 'wp_ajax_nopriv_getsettings', 'mc_swc_get_settings' );

function mc_swc_get_settings() {
	header('Content-Type: application/json');
	echo('{ "cache_images": "'.esc_attr( get_option('cache_images') ).'", "cache_css": "'.esc_attr( get_option('cache_css') ).'", "cache_js": "'.esc_attr( get_option('cache_js') ).'", "cache_other": "'.esc_attr( get_option('cache_other') ).'" }');
	exit();
}
?>