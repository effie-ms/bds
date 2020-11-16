# ENV defaults to local (so that requirements/local.txt are installed), but can be overridden
#  (e.g. ENV=production make setup).
ENV ?= local
# PYTHON specifies the python binary to use when creating virtualenv
PYTHON ?= python3.8

# Editor can be defined globally but defaults to nano
EDITOR ?= nano

# By default we open the editor after copying settings, but can be overridden
#  (e.g. EDIT_SETTINGS=no make settings).
EDIT_SETTINGS ?= yes

# Project name
PROJECT_NAME ?= bds

# Get root dir and project dir
PROJECT_ROOT ?= $(CURDIR)
SITE_ROOT ?= $(PROJECT_ROOT)/$(PROJECT_NAME)

CUR_DIR_NAME ?= $(shell basename `pwd`)
DJANGO_IMAGE_NAME ?= $(CUR_DIR_NAME)_django

BLACK ?= \033[0;30m
RED ?= \033[0;31m
GREEN ?= \033[0;32m
YELLOW ?= \033[0;33m
BLUE ?= \033[0;34m
PURPLE ?= \033[0;35m
CYAN ?= \033[0;36m
GRAY ?= \033[0;37m
COFF ?= \033[0m

.PHONY:
all: help


.PHONY:
help:
	@echo -e "+------<<<<                                 Configuration                                >>>>------+"
	@echo -e ""
	@echo -e "ENV: $(ENV)"
	@echo -e "PYTHON: $(PYTHON)"
	@echo -e "PROJECT_ROOT: $(PROJECT_ROOT)"
	@echo -e "SITE_ROOT: $(SITE_ROOT)"
	@echo -e ""
	@echo -e "+------<<<<                                     Tasks                                    >>>>------+"
	@echo -e ""
	@echo -e "$(CYAN)make setup$(COFF)    - Sets up the project in your local machine"
	@echo -e "                This includes copying PyCharm files, creating local settings file, and setting up Docker."
	@echo -e ""
	@echo -e "$(CYAN)make pycharm$(COFF)  - Copies default PyCharm settings (unless they already exist)"
	@echo -e ""
	@echo -e "$(CYAN)make test$(COFF)     - Runs automatic tests on your python code"
	@echo -e ""
	@echo -e "$(CYAN)make coverage$(COFF) - Runs code test coverage calculation"
	@echo -e ""
	@echo -e "$(CYAN)make quality$(COFF)  - Runs automatic code quality tests on your code"
	@echo -e ""
	@echo -e "$(CYAN)make isort-fix$(COFF) - Fix imports automatically with isort"
	@echo -e ""
	@echo -e "$(CYAN)make black-format-all$(COFF) - Format all Python code"
	@echo -e ""
	@echo -e "$(CYAN)make prettier-format-all$(COFF) - Format all JavaScript code"
	@echo -e ""

.PHONY:
build-pipenv-helper:
	@docker build $(PROJECT_ROOT) -f Dockerfile-pipenv --tag $(PROJECT_NAME)_pipenv_wrapper


.PHONY:
run-pipenv-helper: build-pipenv-helper
	@docker run --rm --name $(PROJECT_NAME)_pipenv_wrapper -v $(PROJECT_ROOT):/src $(PROJECT_NAME)_pipenv_wrapper \
	 sh -c "$(cmd) && chown `id -u`:`id -g` Pipfile.lock"


.PHONY:
pipenv-lock:
	@make run-pipenv-helper cmd="pipenv lock"


Pipfile.lock:
	@make pipenv-lock


.PHONY:
pipenv-check:
	@make run-pipenv-helper cmd="pipenv check"


.PHONY:
pipenv-install:
	@make run-pipenv-helper cmd="pipenv install $(cmd)"


# NOTE:
# As node doesn't depend on any service, we can run prettier
#  directly from the node container with docker-compose
.PHONY:
run-prettier:
	@docker-compose run --rm node $(cmd)


.PHONY:
prettier-check:
	@make run-prettier cmd="yarn prettier-check $(cmd)"


.PHONY:
prettier-check-all:
	@make run-prettier cmd="yarn prettier-check-all $(cmd)"


.PHONY:
prettier-format:
	@make run-prettier cmd="yarn prettier-format $(cmd)"


.PHONY:
prettier-format-cut-prefix:
	@make run-prettier cmd="yarn prettier-format $(subst app/src, src, $(cmd))"


.PHONY:
prettier-format-all:
	@make run-prettier cmd="yarn prettier-format-all $(cmd)"


# NOTE:
# Do not use `docker-compose run` to avoid spawning services by the django container
.PHONY:
run-black:
	@set -e ;\
	if [ "`docker images|grep $(DJANGO_IMAGE_NAME)`" = '' ]; then \
	    docker-compose build django || exit $$?; \
	fi; \
	docker run --rm -v $(SITE_ROOT):/app $(DJANGO_IMAGE_NAME) $(cmd)


.PHONY:
black-check:
	@make run-black cmd="black --check $(cmd)"


.PHONY:
black-check-all:
	@make run-black cmd="black --check ."


.PHONY:
black-format:
	@make run-black cmd="black $(cmd)"


.PHONY:
black-format-all:
	@make run-black cmd="black ."


.PHONY:
docker: settings
	@docker-compose down
	@docker-compose build
	@docker-compose up -d
	@docker-compose logs -f


.PHONY:
setup: pycharm settings
	@echo -e "$(CYAN)Creating Docker images$(COFF)"
	@docker-compose build
	@echo -e "$(CYAN)Running django migrations$(COFF)"
	@make migrate

	@echo -e "$(CYAN)===================================================================="
	@echo "SETUP SUCCEEDED"
	@echo "Run 'make docker' to start Django development server and Webpack.$(COFF)"

.PHONY:
setup-terraform:
	@echo -e "$(CYAN)Setting up terraform$(COFF)"
	@./deploy/terraform/setup.sh $(workspace)

.PHONY:
pycharm: $(PROJECT_ROOT)/.idea


$(PROJECT_ROOT)/.idea:
	@echo -e "$(CYAN)Creating pycharm settings from template$(COFF)"
	@mkdir -p $(PROJECT_ROOT)/.idea && cp -R $(PROJECT_ROOT)/.idea_template/* $(PROJECT_ROOT)/.idea/


.PHONY:
settings: Pipfile.lock $(SITE_ROOT)/settings/local.py $(SITE_ROOT)/settings/local_test.py $(SITE_ROOT)/django.env


$(SITE_ROOT)/settings/local.py:
	echo "$(CYAN)Creating Django local.py settings file$(COFF)"
	cp $(SITE_ROOT)/settings/local.py.example $(SITE_ROOT)/settings/local.py
	if [ $(EDIT_SETTINGS) = "yes" ]; then\
		$(EDITOR) $(SITE_ROOT)/settings/local.py;\
	fi

$(SITE_ROOT)/settings/local_test.py:
	@echo -e "$(CYAN)Creating Django settings local_test.py file$(COFF)"
	@cp $(SITE_ROOT)/settings/local_test.py.example $(SITE_ROOT)/settings/local_test.py

$(SITE_ROOT)/django.env:
	@echo "$(CYAN)Creating Django .env file$(COFF)"
	@touch $(SITE_ROOT)/django.env

.PHONY:
coverage:
	@echo -e "$(CYAN)Running automatic code coverage check$(COFF)"
	@docker-compose run --rm django coverage run -m py.test
	@docker-compose run --rm django coverage html
	@docker-compose run --rm django coverage report
	@docker-compose run --rm node yarn test -- --coverage


.PHONY:
node-install:
	@docker-compose run --rm node yarn


.PHONY:
test-node-watch: clean
	@docker-compose run --rm node yarn test -- --watchAll


.PHONY:
test-node: clean
	@echo -e "$(CYAN)Running automatic node.js tests$(COFF)"
	@docker-compose run --rm node yarn test


.PHONY:
test-django: clean
	@echo -e "$(CYAN)Running automatic django tests$(COFF)"
	@docker-compose run --rm django py.test


.PHONY:
test: test-node test-django


.PHONY:
clean:
	@echo -e "$(CYAN)Cleaning pyc files$(COFF)"
	@cd $(SITE_ROOT) && find . -name "*.pyc" -exec rm -rf {} \;


.PHONY:
lint-py: black-check-all prospector isort

.PHONY:
lint-js: prettier-check-all eslint

.PHONY:
lint: lint-py lint-js

.PHONY:
quality: lint pipenv-check


.PHONY:
eslint:
	@echo -e "$(CYAN)Running ESLint$(COFF)"
	@docker-compose run --rm node yarn lint


.PHONY:
prospector:
	@echo -e "$(CYAN)Running Prospector$(COFF)"
	@docker-compose run --rm django prospector


.PHONY:
stylelint:
	@echo -e "$(CYAN)Running StyleLint$(COFF)"
	@docker-compose run --rm node yarn stylelint


.PHONY:
isort:
	@echo -e "$(CYAN)Checking imports with isort$(COFF)"
	docker-compose run --rm django isort --recursive --check-only -p . --diff


.PHONY:
isort-fix:
	@echo -e "$(CYAN)Fixing imports with isort$(COFF)"
	docker-compose run --rm django isort --recursive -p .


.PHONY:
docker-django:
	docker-compose run --rm django $(cmd)


.PHONY:
django-shell:
	docker-compose run --rm django bash


.PHONY:
node-shell:
	docker-compose run --rm node bash


.PHONY:
docker-manage:
	docker-compose run --rm django ./manage.py $(cmd)


.PHONY:
shell:
	docker-compose run --rm django ./manage.py shell


.PHONY:
makemigrations:
	docker-compose run --rm django ./manage.py makemigrations $(cmd)


.PHONY:
migrate:
	docker-compose run --rm django ./manage.py migrate $(cmd)


.PHONY:
docker-logs:
	docker-compose logs -f


.PHONY:
makemessages:
	docker-compose run --rm django ./manage.py makemessages -a

.PHONY:
extract-i18n:
	docker-compose run --rm node yarn extract-i18n

.PHONY:
compilemessages:
	docker-compose run --rm django ./manage.py compilemessages


$(SITE_ROOT)/locale:
	mkdir -p $(SITE_ROOT)/locale


.PHONY:
add-locale: $(SITE_ROOT)/locale
ifdef LOCALE
	@echo -e "Adding new locale $(LOCALE)"
	docker-compose run --rm django ./manage.py makemessages -l $(LOCALE)
	docker-compose run --rm django ./manage.py makemessages -d djangojs -i node_modules -l $(LOCALE)
	@echo -e "Restoring file permissions"
	@docker-compose run --rm django sh -c "chown -R `id -u`:`id -g` ./locale/"
else
	@echo -e "$(RED)Please specify the locale you would like to add via LOCALE (e.g. make add-locale LOCALE='et')$(COFF)"
endif


.PHONY:
psql:
	docker-compose exec postgres psql --user $(PROJECT_NAME) --dbname $(PROJECT_NAME)


.PHONY:
docs:
	docker-compose run --rm django sphinx-build ./docs ./docs/_build

