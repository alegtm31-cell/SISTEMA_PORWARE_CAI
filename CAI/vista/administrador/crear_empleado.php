<?php
require_once '../../inc/subcabeza.php'; 
require_once '../../modelo/clases.php';

$c = new Conexion();
$u= new Usuario();

$u->autenticar_ingreso();

require_once '../../inc/fecha.php'; 

require_once '../../inc/menu_administrador.php'; 
?>

<div class="row">
	<h4 class="titulo_color">Registrar Empleado</h4>
	<hr>
		<div class="col-xs-12">         
		    <form role="form" action="../../controlador/crear_empleado.php" method="post" onsubmit="return validar_registro_empleado()">
				<p>Los campos con ( * ) son obligatorios.</p>
		        <div class="form-group">
		            <label for="cedula">Cedula de Identidad *</label>
		            <input id="cedula" name="cedula" type="text" maxlength="8" onkeypress="return permite(event, 'num')" class="form-control" required>
		        </div>
		      
		        <div class="form-group">
		            <label for="nombre">Nombre *</label>
		            <input id="nombre" name="nombre" type="text" maxlength="20" onkeypress="return permite(event, 'car')" class="form-control" required>
		        </div>

		        <div class="form-group">
		            <label for="apellido">Apellido *</label>
		            <input id="apellido" name="apellido" type="text" maxlength="20" onkeypress="return permite(event, 'car')" class="form-control" required>
		        </div>

		        <div class="form-group">
		            <label for="cargo">Cargo</label>
		            <input id="cargo" name="cargo" type="text"  maxlength="30" onkeypress="return permite(event, 'car')" class="form-control">
		        </div>

		        <div class="form-group">
		            <label for="departamento">Departamento</label>
		            <input id="departamento" name="departamento" type="text"  maxlength="30" onkeypress="return permite(event, 'car')" class="form-control">
		        </div>

		        <div class="form-group">
		            <label for="correo">Correo Electronico</label>
		            <input id="correo" name="correo" type="email"  maxlength="50" onkeypress="return permite(event, 'num_car')" class="form-control">
		        </div>

		        <div class="form-group">
		            <label for="telefono_movil">Teléfono Móvil</label>
		            <input id="telefono_movil" name="telefono_movil" type="text" maxlength="11" onkeypress="return permite(event, 'num')" class="form-control">
		        </div>

		        <div class="form-group">
		            <label for="telefono_fijo">Teléfono de Habitacion</label>
		            <input id="telefono_fijo" name="telefono_fijo" type="text"  maxlength="11" onkeypress="return permite(event, 'num')" class="form-control">
		        </div>

		        <div class="form-group">
		            <label for="rol">Seleccione el rol *</label>
		            <select id="rol" name="rol" class="form-control">
		                <option value=0>Seleccione</option>
		                <option value=1>Administrador</option>
		                <option value=2>Empleado</option>
		                <option value=3>Seguridad</option>
          			</select>
		        </div>

		        <div class="form-group row">  
		            <div class="col-xs-12">                      
		                <button type="submit" class="btn btn-primary btn-md btn-block">Guardar</button>
		            </div>
		        </div>
		    </form>
		</div>
</div>


<?php mysql_close($c->getConex()); require_once '../../inc/subpie.php'; ?>