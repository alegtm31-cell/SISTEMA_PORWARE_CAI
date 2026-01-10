<?php
require_once '../../modelo/clases.php';

$c= new Conexion();
$u= new Usuario();

$u->autenticar_ingreso();

?>

<div class="modal-header">
    <!-- <button type="button" class="close" data-dismiss="modal">&times;</button>   <div class="col-xs-12 col-sm-9 col-md-7 col-lg-6">-->
    <h4 class="modal-title">Eliminar Noticia</h4>
</div>

<div class="modal-body">
    <div class="container">      
        <div class="row">
            <div class="col-xs-12 col-sm-9 col-md-7 col-lg-6">

                <form role="form" action="../../controlador/eliminar_noticia.php" method="post">

                    <h4 class="text-center">¿Deseas eliminar esta noticia?</h4>

                    <br>

                    <input name="id_noticia" type="hidden" value="<?php echo $_GET['id_noticia']; ?>">                    

                    <div class="form-group row">  
                        <div class="col-xs-3 col-xs-offset-3">                      
                            <button type="submit" class="btn btn-danger btn-md">Eliminar</button>
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