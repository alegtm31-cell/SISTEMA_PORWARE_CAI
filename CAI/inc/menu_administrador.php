<div class="container">
	<div class="row">
		<div class="banda_ident">
			<div class="col-xs-6 col-sm-6 col-sm-offset-3">
				<p class="text-center titulo_modulo"><b>Administrador</b></p>
			</div>
			<div class="col-xs-6 col-sm-3">
				<p class="text-right texto_saludo"><?php echo 'Hola, <b id="nombre_usuario">'.$_SESSION['nombre'].'</b> '?>&nbsp;<span class="iconocolor fa fa-user fa-lg"></span></p>
			</div>
		</div>
	</div>
</div>

<div class="container">
	<div class="row">
		<div class="col-sm-4 col-md-3">
			<div class="sidebar-nav menu_vertical">
				 <div class="navbar navbar-default" role="navigation">
				    <div class="navbar-header">
				      	<button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".sidebar-navbar-collapse">
				        	<span class="icon-bar"></span>
				        	<span class="icon-bar"></span>
				        	<span class="icon-bar"></span>
				      	</button>
				      	<span class="visible-xs navbar-brand">Menu</span>
				    </div>
				    <div class="navbar-collapse collapse sidebar-navbar-collapse">
				      	<ul class="nav navbar-nav">
					        <li><a href="index.php"><span class="fa fa-home fa-2x"></span>&nbsp;&nbsp;Inicio</a></li>
					        <li><a href="crear_empleado.php"><span class="fa fa-plus-circle fa-2x"></span>&nbsp;&nbsp;Crear empleado</a></li>
					        <li><a href="empleados.php"><span class="fa fa-list-alt fa-2x"></span>&nbsp;&nbsp;Empleados</a></li>
					        <li><a href="historial.php"><span class="fa fa-history fa-2x"></span>&nbsp;&nbsp;Historial</a></li>
					        <li><a href="noticias.php"><span class="fa fa-comments fa-2x"></span>&nbsp;&nbsp;Noticias</a></li>
					        <li><a href="modificar_perfil.php"><span class="fa fa-user fa-2x"></span>&nbsp;&nbsp;Mi Perfil</a></li>
					        <li><a href="../../controlador/cerrar_session.php"><span class="fa fa-power-off fa-2x"></span>&nbsp;&nbsp;Cerrar Sesión</a></li>
				      	</ul>
				    </div>
		      	</div>
	    	</div>
		</div>
		<div class="col-sm-8 col-md-9">