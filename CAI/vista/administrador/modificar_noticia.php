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
    <h4 class="modal-title">Modificar Noticia</h4>
</div>

<div class="modal-body">
    <div class="container">      
        <div class="row">
            <div class="col-xs-12 col-sm-9 col-md-7 col-lg-6">

                <form role="form" action="../../controlador/modificar_noticia.php" method="post" enctype="multipart/form-data">

                    <input name="id_noticia" type="hidden" value="<?php echo $noticia['id_noticia']; ?>">

                    <p>Los campos con ( * ) son obligatorios.</p>

                    <div class="form-group">
                        <label for="titulo">Título *</label>
                        <input id="titulo" name="titulo" value="<?php echo $noticia['titulo']; ?>" type="text" maxlength="50" onkeypress="return permite(event, 'num_car')" class="form-control" required>
                    </div>



                    <div class="form-group">
                        <label for="contenido">Contenido *</label>
                        <textarea id="contenido" name="contenido" maxlength="2000" onkeypress="return permite(event, 'num_car')" class="form-control" rows="10" required><?php echo $noticia['contenido']; ?></textarea>
                    </div>

                    <?php if ($noticia['imagen']): ?>
                        <img src='<?php echo $noticia['imagen']; ?>' style=' width: 100px; height: 100px;'><br> 
                    <?php endif ?>                                       

                    <div class="form-group">
                        <label for="imagen">Agregar Imagen&nbsp;&nbsp;&nbsp;<i class="fa fa-paperclip fa-2x"></i></label>
                        <input id="imagen" name="imagen" type="file" class="form-control">
                    </div>                   

                    <div class="form-group row">  
                        <div class="col-xs-3 col-xs-offset-3">                      
                            <button type="submit" class="btn btn-primary btn-md">Publicar</button>
                        </div>
                        <div class="col-xs-3 col-xs-offset-1">                      
                            <button type="button" class="btn btn-info btn-md" onclick="location.href='noticias.php'">Cancelar</button>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    </div>    
</div>