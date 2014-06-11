<?php

function pai_scripts() {
  pai_trigger_error('pai_scripts() is deprecated. Use pai_footer() instead', E_USER_DEPRECATED, 1);
  pai_footer();
}
