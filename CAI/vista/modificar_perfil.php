<?php
require_once '../../modelo/clases.php';

$c= new Conexion();
$u= new Usuario();

$fila= $u->datos_usuario($c->getConex(), $_SESSION['id_usuario']);

?>
<h4 class="titulo_color">Mi Perfil</h4>
<div class="col-xs-12">
<hr>         
    <form role="form" action="../../controlador/modificar_perfil.php" method="post" onsubmit="return validar_registro_usuario()" >
        
        <p>Los campos con ( * ) son obligatorios.</p>

        <input name="id_usuario" type="hidden" value="<?php echo $fila['id_usuario']; ?>">

        <div class="form-group">
            <label for="cedula">Cedula de Identidad *</label>
            <input id="cedula" name="cedula" type="text" value="<?php echo $fila['cedula']; ?>" class="form-control" disabled>
        </div>
      
        <div class="form-group">
            <label for="nombre">Nombre *</label>
            <input id="nombre" name="nombre" type="text" value="<?php echo $fila['nombre']; ?>" class="form-control" disabled>
        </div>

        <div class="form-group">
            <label for="apellido">Apellido *</label>
            <input id="apellido" name="apellido" type="text" value="<?php echo $fila['apellido']; ?>" class="form-control" disabled>
        </div>

        <div class="form-group">
            <label for="cargo">Cargo *</label>
            <input id="cargo" name="cargo" type="text" value="<?php echo $fila['cargo']; ?>" maxlength="30" onkeypress="return permite(event, 'car')" class="form-control" required>
        </div>

        <div class="form-group">
            <label for="departamento">Departamento</label>
            <input id="departamento" name="departamento" type="text" value="<?php echo $fila['departamento']; ?>" maxlength="30" onkeypress="return permite(event, 'car')" class="form-control">
        </div>

        <div class="form-group">
            <label for="correo">Correo Electronico *</label>
            <input id="correo" name="correo" type="email" value="<?php echo $fila['correo']; ?>" maxlength="50" onkeypress="return permite(event, 'num_car')" class="form-control" required>
        </div>

        <div class="form-group">
            <label for="telefono_movil">Teléfono Móvil *</label>
            <input id="telefono_movil" name="telefono_movil" type="text" value="<?php echo $fila['telefono_movil']; ?>" maxlength="11" onkeypress="return permite(event, 'num')" class="form-control" required>
        </div>

        <div class="form-group">
            <label for="telefono_fijo">Teléfono de Habitacion</label>
            <input id="telefono_fijo" name="telefono_fijo" type="text" value="<?php echo $fila['telefono_fijo']; ?>" maxlength="11" onkeypress="return permite(event, 'num')" class="form-control" >
        </div>

        <div class="form-group">
            <label for="clave">Crear clave *</label>
            <input id="clave" name="clave" type="password" maxlength="20" onkeypress="return permite(event, 'num_car')" class="form-control" required>
        </div>

        <div class="form-group">
            <label for="clave2">Confirmar clave *</label>
            <input id="clave2" name="clave2" type="password" maxlength="20" onkeypress="return permite(event, 'num_car')" class="form-control" required>
        </div>

        <div class="form-group row">  
            <div class="col-xs-12">                      
                <button type="submit" class="btn btn-primary btn-md btn-block">Guardar</button>
            </div>
        </div>
    </form>
</div>