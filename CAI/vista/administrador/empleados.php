<?php
require_once '../../inc/subcabeza.php'; 
require_once '../../modelo/clases.php';

$c = new Conexion();
$u= new Usuario();

$u->autenticar_ingreso();
$usuarios_obj= $u->obtener_usuarios($c->getConex());

require_once '../../inc/fecha.php';

require_once '../../inc/menu_administrador.php'; 
?>

<div class="pull-right">	
	<form role="form" id="form-cedula-buscar">
        <div class="form-group row">
            <div class="col-xs-2">
            	<button type="submit" class="btn btn-primary btn-md"><i class="fa fa-search fa-lg"></i></button>
            </div>
            <div class="col-xs-10">
                <input name="cedula" id="cedula_buscar" type="text" class="form-control input-md" placeholder='Buscar empleado por cedula' maxlength="8" onkeypress="return permite(event, 'num')" required>
            </div>                       
        </div>
    </form>
</div>

<h4 class="titulo_color">Lista de Empleados</h4>

<div class="clearfix"></div>

<div id="resultado_buscar_cedula"></div>

<hr>

<div class="row">
	<div class="col-xs-12">
		<div class="table-responsive">
			<table class="table table-striped table-hover texto_medio">
				<thead>
					<tr>
						<th><b>Cedula</b></th>
						<th><b>Nombre</b></th>
						<th><b>Apellido</b></th>
						<th><b>Rol</b></th>
						<th><b>Acción</b></th>
					</tr>
				</thead>
				<tbody>
	

<?php
	while($usuario=mysql_fetch_array($usuarios_obj)){
		echo "<tr><td>".$usuario['cedula']."</td>";
		echo "<td>".$usuario['nombre']."</td>";
		echo "<td>".$usuario['apellido']."</td>";
		echo "<td>";
		switch ($usuario['rol']) {

			case 1:
			echo "Administrador";
			break;

			case 2:
			echo "Empleado";
			break;

			case 3:
			echo "Seguridad";
			break;

			default:
			exit('Error en la base de datos, consulte al administrador');
			break;
		}
		echo "</td>";

		echo '
		<td>
		<a data-toggle="modal" data-target="#modificar_empleado" href="modificar_empleado.php?id_usuario='.$usuario["id_usuario"].'"><i class="fa fa-pencil fa-lg"></i></a>

		&nbsp;&nbsp;|&nbsp;&nbsp

		<a data-toggle="modal" data-target="#eliminar_empleado" href="eliminar_empleado.php?id_usuario='.$usuario["id_usuario"].'"><i class="fa fa-trash-o fa-lg"></i></a>

		</td>';
	}
?>
				</tbody>
			</table>
		</div>
	</div>
</div>

<div class="modal fade" id="modificar_empleado" tabindex="-1" role="dialog" data-keyboard="false" data-backdrop="static">
    <div class="modal-dialog" role="document">
        <div class="modal-content">

        </div>
    </div>
</div>

<div class="modal fade" id="eliminar_empleado" tabindex="-1" role="dialog" data-keyboard="false" data-backdrop="static">
    <div class="modal-dialog" role="document">
        <div class="modal-content" id="modal-box">

        </div>
    </div>
</div>

<?php mysql_close($c->getConex()); require_once '../../inc/subpie.php'; ?>