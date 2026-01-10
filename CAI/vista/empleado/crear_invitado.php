<?php
require_once '../../inc/subcabeza.php'; 
require_once '../../modelo/clases.php';

$c = new Conexion();
$u= new Usuario();

$u->autenticar_ingreso();

require_once '../../inc/fecha.php';

require_once '../../inc/menu_empleado.php'; 
?>

<h4 class="titulo_color">Registrar Invitado</h4>

<hr>

<div class="row">
    <div class="col-xs-12">
        <form role="form" action="../../controlador/crear_invitado.php" method="post" onsubmit="return validar_modificar_invitado()">
            <p>Los campos con ( * ) son obligatorios.</p>

            <input name="id_anfitrion" type="hidden" value="<?php echo $_SESSION['id_usuario']; ?>">
            
            <div class="form-group">
                <label for="cedula_invitado">Cedula de Identidad *</label>
                <input id="cedula_invitado" name="cedula_invitado" type="text" maxlength="8" onkeypress="return permite(event, 'num')" class="form-control" required>
            </div>
          
            <div class="form-group">
                <label for="nombre_invitado">Nombre *</label>
                <input id="nombre_invitado" name="nombre_invitado" type="text" maxlength="20" onkeypress="return permite(event, 'car')" class="form-control" required>
            </div>

            <div class="form-group">
                <label for="apellido_invitado">Apellido *</label>
                <input id="apellido_invitado" name="apellido_invitado" type="text" maxlength="20" onkeypress="return permite(event, 'car')" class="form-control" required>
            </div>

            <div class="form-group">
                <label for="placa">Placa del Vehículo</label>
                <input id="placa" name="placa" type="text" maxlength="10" onkeypress="return permite(event, 'num_car')" class="form-control">
            </div>

            <div class="form-group">
                <label for="telefono_movil_invitado">Teléfono Móvil</label>
                <input id="telefono_movil_invitado" name="telefono_movil_invitado" type="text" maxlength="11" onkeypress="return permite(event, 'num')" class="form-control">
            </div>

            <div class="form-group">
                <label for="telefono_fijo_invitado">Teléfono de Habitacion</label>
                <input id="telefono_fijo_invitado" name="telefono_fijo_invitado" type="text" maxlength="11" onkeypress="return permite(event, 'num')" class="form-control">
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