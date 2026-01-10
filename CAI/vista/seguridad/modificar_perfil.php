<?php
require_once '../../inc/subcabeza.php'; 
require_once '../../modelo/clases.php';

$c = new Conexion();
$u= new Usuario();

$u->autenticar_ingreso();

require_once '../../inc/fecha.php'; 

require_once '../../inc/menu_seguridad.php'; 
?>

	<div class="row">			
		<?php require_once '../modificar_perfil.php'; ?>
	</div>

<?php mysql_close($c->getConex()); require_once '../../inc/subpie.php'; ?>