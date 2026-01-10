<?php
require_once '../../modelo/clases.php';

$c= new Conexion();
$u= new Usuario();
$i= new Invitado();

$u->autenticar_ingreso();
$fila= $i->datos_invitado($c->getConex(), $_GET['id_invitado']);

?>

<div class="modal-header">
    <!-- <button type="button" class="close" data-dismiss="modal">&times;</button> -->
    <h4 class="modal-title">Modificar Invitado</h4>
</div>

<div class="modal-body">
    <div class="container">      
        <div class="row">
            <div class="col-xs-12 col-sm-9 col-md-7 col-lg-6">
                <form role="form" action="../../controlador/modificar_invitado.php" method="post" onsubmit="return validar_modificar_invitado()">
                    <input name="id_invitado" type="hidden" value="<?php echo $fila['id_invitado']; ?>">
                    <p>Los campos con ( * ) son obligatorios.</p>

                    <div class="form-group">
                        <label for="cedula_invitado">Cedula de Identidad *</label>
                        <input id="cedula_invitado" name="cedula_invitado" type="text" value="<?php echo $fila['cedula_invitado']; ?>" maxlength="8" onkeypress="return permite(event, 'num')" class="form-control" required>
                    </div>
                  
                    <div class="form-group">
                        <label for="nombre">Nombre *</label>
                        <input id="nombre_invitado" name="nombre_invitado" type="text" value="<?php echo $fila['nombre_invitado']; ?>" maxlength="20" onkeypress="return permite(event, 'car')" class="form-control" required>
                    </div>

                    <div class="form-group">
                        <label for="apellido">Apellido *</label>
                        <input id="apellido_invitado" name="apellido_invitado" type="text" value="<?php echo $fila['apellido_invitado']; ?>" maxlength="20" onkeypress="return permite(event, 'car')" class="form-control" required>
                    </div>

                    <div class="form-group">
                        <label for="placa">Placa del Vehículo</label>
                        <input id="placa" name="placa" type="text" value="<?php echo $fila['placa']; ?>" maxlength="10" onkeypress="return permite(event, 'num_car')" class="form-control">
                    </div>

                    <div class="form-group">
                        <label for="telefono_movil_invitado">Teléfono Móvil</label>
                        <input id="telefono_movil_invitado" name="telefono_movil_invitado" type="text" value="<?php echo $fila['telefono_movil_invitado']; ?>" maxlength="11" onkeypress="return permite(event, 'num')" class="form-control">
                    </div>

                    <div class="form-group">
                        <label for="telefono_fijo_invitado">Teléfono de Habitacion</label>
                        <input id="telefono_fijo_invitado" name="telefono_fijo_invitado" type="text" value="<?php echo $fila['telefono_fijo_invitado']; ?>" maxlength="11" onkeypress="return permite(event, 'num')" class="form-control">
                    </div>

                    <div class="form-group row">  
                        <div class="col-xs-12">                      
                            <button type="submit" class="btn btn-primary btn-md btn-block">Guardar</button>
                        </div>
                    </div>

                    <div class="form-group row">  
                        <div class="col-xs-12">                      
                            <button type="button" class="btn btn-info btn-md btn-block" onclick="location.href='historial.php'">Volver</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>    
</div>