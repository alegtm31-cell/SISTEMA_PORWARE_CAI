<?php require_once '../inc/cabeza.php'; ?>

    <div class="container">
        <div class="row">
            <div class="col-xs-12 col-sm-6 col-sm-offset-3 col-lg-4 col-lg-offset-4" id="login-box">    
                <h2 class="text-center titulo_color">Acceso al Sistema</h2>
                <br>
                <form role="form" id="form-login">
                    <div class="form-group row">
                        <span class="col-xs-2 text-right fa fa-envelope-o fa-2x"></span>
                        <div class="col-xs-10">
                            <input name="correo" id="correo_login" type="email" class="form-control input-lg" placeholder='Correo Electronico' maxlength="50" onkeypress="return permite(event, 'num_car')" required>
                        </div>
                    </div>

                    <div class="form-group row">
                        <span class="col-xs-2 text-right fa fa-lock fa-3x"></span>
                        <div class="col-xs-10">
                            <input name="clave" id="clave_login" type="password" class="form-control input-lg" placeholder='Clave' maxlength="25" onkeypress="return permite(event, 'num_car')" required>
                        </div>
                    </div>
                    
                    <div class="form-group row">  
                        <div class="col-xs-12">                      
                            <button type="submit" class="btn btn-primary btn-lg btn-block">Acceder</button>
                        </div>
                    </div>
                    <div id="resultado_login_invalido"></div><br>
                    <div class="col-xs-12 text-center">
                    <a href="#registrate" data-toggle="modal" class="texto_funcion">Registrate</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="#olvidaste" data-toggle="modal" class="texto_funcion">¿Olvidaste tu clave?</a>
                    </div>
                </form>
            </div>
        </div>       
    </div>

    <div class="modal fade" id="registrate" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content" id="modal-box">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal">&times;</button>
                    <h4 class="modal-title">Valida tus datos</h4>
                    </div>
                <div class="modal-body">
                    <form role="form" id="form-cedula">
                        <div class="form-group row">
                            <span class="col-xs-2 text-right fa fa-credit-card fa-3x"></span>
                            <div class="col-xs-10">
                                <input name="cedula" id="cedula_valida" type="text" class="form-control input-lg" placeholder='Ingresa tu cedula de identidad' maxlength="8" onkeypress="return permite(event, 'num')" required>
                            </div>
                        </div>

                        <div class="form-group row">  
                            <div class="col-xs-12">                      
                                <button type="submit" class="btn btn-primary btn-lg btn-block">Validar</button>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <div id="resultado_cedula_invalida"></div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="registrate_formulario" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">

            </div>
        </div>
    </div>

    <div class="modal fade" id="olvidaste" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content" id="modal-box">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal">&times;</button>
                    <h4 class="modal-title">Recupera tu clave</h4>
                    </div>
                <div class="modal-body">

                    <form role="form" id="form-correo">
                        <div class="form-group row">
                            <span class="col-xs-2 text-right fa fa-envelope fa-3x"></span>
                            <div class="col-xs-10">
                                <input name="correo_recupera" id="correo_recupera" type="email" class="form-control input-lg" placeholder='Ingresa tu correo electronico' maxlength="50" onkeypress="return permite(event, 'num_car')" required>
                            </div>
                        </div>
                        
                        <div class="form-group row">  
                            <div class="col-xs-12">                      
                                <button type="submit" class="btn btn-primary btn-lg btn-block">Recuperar</button>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <div id="resultado_correo_invalido"></div>
                </div>
            </div>
        </div>
    </div>

<?php require_once '../inc/pie.php'; ?>