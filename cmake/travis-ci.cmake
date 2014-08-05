set(CTEST_SOURCE_DIRECTORY "$ENV{TRAVIS_BUILD_DIR}")
set(CTEST_BINARY_DIRECTORY "$ENV{TRAVIS_BUILD_DIR}/_build")

set(CTEST_SITE Travis)
set(CTEST_BUILD_NAME "Linux-$ENV{TRAVIS_BRANCH}")
set(CTEST_CMAKE_GENERATOR "Unix Makefiles")

ctest_start(Continuous)
ctest_configure()
ctest_test(RETURN_VALUE res)

if(NOT res EQUAL 0)
  message(FATAL_ERROR "Test failures occurred.")
endif()
