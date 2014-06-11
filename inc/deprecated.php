<?php

function pai_scripts() {
  pai_trigger_error('pai_scripts() is deprecated. Use pai_foot() instead', E_USER_DEPRECATED, 1);
  pai_foot();
}

function pai_footer() {
  pai_trigger_error('pai_footer() is deprecated. Use pai_foot() instead', E_USER_DEPRECATED, 1);
  pai_foot();
}
