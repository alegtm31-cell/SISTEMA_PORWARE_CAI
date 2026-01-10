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
    <h4 class="modal-title">Detalles del Invitado</h4>
</div>

<div class="modal-body">
    <div class="container">      
        <div class="row">
            <div class="col-xs-12 col-sm-9 col-md-7 col-lg-6">

                <p class="texto_medio"><b class="text_azul">Cedula:</b>&nbsp;&nbsp;&nbsp;&nbsp;<?php echo $fila['cedula_invitado']; ?></p>
                <p class="texto_medio"><b class="text_azul">Nombre:</b>&nbsp;&nbsp;&nbsp;&nbsp;<?php echo $fila['nombre_invitado']; ?></p>
                <p class="texto_medio"><b class="text_azul">Apellido:</b>&nbsp;&nbsp;&nbsp;&nbsp;<?php echo $fila['apellido_invitado']; ?></p>

                <?php if ($fila['placa']): ?>
                    <p class="texto_medio"><b class="text_azul">Placa del Vehículo:</b>&nbsp;&nbsp;&nbsp;&nbsp;<?php echo $fila['placa']; ?></p>
                <?php endif ?>
                
                <?php if ($fila['telefono_movil_invitado']): ?>
                    <p class="texto_medio"><b class="text_azul">Teléfono Celular:</b>&nbsp;&nbsp;&nbsp;&nbsp;<?php echo $fila['telefono_movil_invitado']; ?></p>
                <?php endif ?>
                
                <?php if ($fila['telefono_fijo_invitado']): ?>
                    <p class="texto_medio"><b class="text_azul">Teléfono Habitación:</b>&nbsp;&nbsp;&nbsp;&nbsp;<?php echo $fila['telefono_fijo_invitado']; ?></p>
                <?php endif ?>

                <?php if ($fila['fecha']): ?>
                    <p class="texto_medio"><b class="text_azul">Fecha:</b>&nbsp;&nbsp;&nbsp;&nbsp;<?php echo $fila['fecha']; ?></p>
                <?php endif ?>

                <?php if ($fila['nombre']): ?>
                    <p class="texto_medio"><b class="text_azul">Anfitrión:</b>&nbsp;&nbsp;&nbsp;&nbsp;<?php echo $fila['nombre']." ".$fila['apellido']; ?></p>
                <?php endif ?>

                <?php if ($fila['estatus']): ?>
                    <p class="texto_medio"><b class="text_azul">Estatus:</b>&nbsp;&nbsp;&nbsp;&nbsp;<?php echo $fila['estatus']; ?></p>
                <?php endif ?>
                
                <?php if ($fila['hora_entrada']): ?>
                    <p class="texto_medio"><b class="text_azul">Hora de entrada:</b>&nbsp;&nbsp;&nbsp;&nbsp;<?php echo $fila['hora_entrada']; ?></p>
                <?php endif ?>
                
                <?php if ($fila['hora_salida']): ?>
                    <p class="texto_medio"><b class="text_azul">Hora de salida:</b>&nbsp;&nbsp;&nbsp;&nbsp;<?php echo $fila['hora_salida']; ?></p>
                <?php endif ?>
                
                <?php if ($fila['observacion']): ?>
                    <p class="texto_medio"><b class="text_azul">Observación:</b></p>
                    <p class="texto_medio"><?php echo $fila['observacion']; ?></p>
                <?php endif ?>

                <br> 
                <button type="button" class="btn btn-info btn-md btn-block" onclick="location.href='historial.php'">Volver</button>
            </div>
        </div>
    </div>    
</div>