cmake_minimum_required(VERSION 2.8.6)

project(Cinema)

include(CTest)
enable_testing()

option(JAVASCRIPT_STYLE_TESTS "Run Javascript style tests." ON)

if(JAVASCRIPT_STYLE_TESTS)
  find_program(JSHINT_EXECUTABLE jshint ${PROJECT_SOURCE_DIR}/node_modules/jshint/bin)

  function(add_javascript_style_test name input)
    add_test(
      NAME "js_style_${name}"
      WORKING_DIRECTORY "${PROJECT_SOURCE_DIR}/web"
      COMMAND "${JSHINT_EXECUTABLE}"
      --verbose
      --config "${PROJECT_SOURCE_DIR}/web/testing/jshint.cfg"
      "${input}"
    )
  endfunction()

  add_javascript_style_test(app src/js/app)
  add_javascript_style_test(lib src/js/lib)
endif()
