<?php
require_once '../../modelo/clases.php';

$c= new Conexion();
$u= new Usuario();
$n= new Noticia();

$u->autenticar_ingreso();
$noticia= $n->datos_noticia($c->getConex(), $_GET['id_noticia']);

?>

<div class="modal-header">
    <!-- <button type="button" class="close" data-dismiss="modal">&times;</button>   <div class="col-xs-12 col-sm-9 col-md-7 col-lg-6">-->
    <h4 class="modal-title"><?php echo $noticia['titulo']; ?></h4>
</div>

<div class="modal-body">
    <div class="container">      
        <div class="row">
            <div class="col-xs-12 col-sm-9 col-md-7 col-lg-6">

                <p><?php echo $noticia['contenido']; ?></p>

                <?php if ($noticia['imagen']): ?>                    
                    <img src='<?php echo $noticia['imagen']; ?>' class="img_detalle_noticia center-block">
                    <br>
                <?php endif ?>               

                <br>                                                     

                <div class="form-group row">  
                    <div class="col-xs-12">                      
                        <button type="button" class="btn btn-primary btn-md btn-block" onclick="location.href='index.php'">Volver</button>
                    </div>
                </div>
            </div>
        </div>
    </div>    
</div>