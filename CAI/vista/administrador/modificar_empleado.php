<?php
require_once '../../modelo/clases.php';

$c= new Conexion();
$u= new Usuario();

$u->autenticar_ingreso();
$fila= $u->datos_usuario($c->getConex(), $_GET['id_usuario']);

?>

<div class="modal-header">
    <!-- <button type="button" class="close" data-dismiss="modal">&times;</button> -->
    <h4 class="modal-title">Modificar Empleado</h4>
</div>

<div class="modal-body">
    <div class="container">      
        <div class="row">
            <div class="col-xs-12 col-sm-9 col-md-7 col-lg-6">
                <form role="form" action="../../controlador/modificar_empleado.php" method="post" onsubmit="return validar_registro_empleado()">
                    <input name="id_usuario" type="hidden" value="<?php echo $fila['id_usuario']; ?>">
                    <p>Los campos con ( * ) son obligatorios.</p>

                    <div class="form-group">
                        <label for="cedula">Cedula de Identidad *</label>
                        <input id="cedula" name="cedula" type="text" value="<?php echo $fila['cedula']; ?>" maxlength="8" onkeypress="return permite(event, 'num')" class="form-control" required>
                    </div>
                  
                    <div class="form-group">
                        <label for="nombre">Nombre *</label>
                        <input id="nombre" name="nombre" type="text" value="<?php echo $fila['nombre']; ?>" maxlength="20" onkeypress="return permite(event, 'car')" class="form-control" required>
                    </div>

                    <div class="form-group">
                        <label for="apellido">Apellido *</label>
                        <input id="apellido" name="apellido" type="text" value="<?php echo $fila['apellido']; ?>" maxlength="20" onkeypress="return permite(event, 'car')" class="form-control" required>
                    </div>

                    <div class="form-group">
                        <label for="cargo">Cargo</label>
                        <input id="cargo" name="cargo" type="text" value="<?php echo $fila['cargo']; ?>" maxlength="30" onkeypress="return permite(event, 'car')" class="form-control">
                    </div>

                    <div class="form-group">
                        <label for="departamento">Departamento</label>
                        <input id="departamento" name="departamento" type="text" value="<?php echo $fila['departamento']; ?>" maxlength="30" onkeypress="return permite(event, 'car')" class="form-control">
                    </div>

                    <div class="form-group">
                        <label for="correo">Correo Electronico</label>
                        <input id="correo" name="correo" type="email" value="<?php echo $fila['correo']; ?>" maxlength="50" onkeypress="return permite(event, 'num_car')" class="form-control">
                    </div>

                    <div class="form-group">
                        <label for="telefono_movil">Teléfono Móvil</label>
                        <input id="telefono_movil" name="telefono_movil" type="text" value="<?php echo $fila['telefono_movil']; ?>" maxlength="11" onkeypress="return permite(event, 'num')" class="form-control">
                    </div>

                    <div class="form-group">
                        <label for="telefono_fijo">Teléfono de Habitacion</label>
                        <input id="telefono_fijo" name="telefono_fijo" type="text" value="<?php echo $fila['telefono_fijo']; ?>" maxlength="11" onkeypress="return permite(event, 'num')" class="form-control">
                    </div>

                    <div class="form-group">
                        <label for="rol">Seleccione el rol *</label>
                        <select id="rol" name="rol" class="form-control">
                            <?php
                            switch ($fila['rol']) {
                                case 1:
                                    echo "
                                    <option value=1 selected>Administrador</option>
                                    <option value=2>Empleado</option>
                                    <option value=3>Seguridad</option>
                                    "; 
                                    break;
                                case 2:
                                    echo "
                                    <option value=2 selected>Empleado</option>
                                    <option value=1>Administrador</option>                                    
                                    <option value=3>Seguridad</option>
                                    ";
                                    break;
                                case 3:
                                    echo "
                                    <option value=3 selected>Seguridad</option>
                                    <option value=2>Empleado</option>
                                    <option value=1>Administrador</option>
                                    ";
                                    break;

                                default:
                                    exit('Error en la base de datos, consulte al administrador');
                                    break;
                            }
                            ?>
                        </select>
                    </div>

                    <div class="form-group row">  
                        <div class="col-xs-12">                      
                            <button type="submit" class="btn btn-primary btn-md btn-block">Guardar</button>
                        </div>
                    </div>

                    <div class="form-group row">  
                        <div class="col-xs-12">                      
                            <button type="button" class="btn btn-info btn-md btn-block" onclick="location.href='empleados.php'">Volver</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>    
</div>