"""
Usage:
    fab [target] [action ...]

Use `fab --list` to see available targets and actions.
"""
from time import sleep
import ConfigParser
import string
import os
import re
import json
import yaml

from StringIO import StringIO
from distutils.version import LooseVersion

from fabric import colors, operations
from fabric.api import abort, cd, env, prompt, require, sudo, task, local, warn_only
from fabric.contrib.console import confirm
from fabric.operations import get, put
from fabric.contrib.files import append, exists
from fabric.utils import indent

import boto3

from django.utils.crypto import get_random_string

from hammer import __version__ as hammer_version

# Ensure that we have expected version of the tg-hammer package installed
assert LooseVersion(hammer_version) >= LooseVersion('0.6'), "tg-hammer 0.6.x is required"

from hammer.vcs import Vcs
from hammer.docker_network import create_docker_network


vcs = Vcs.init(project_root=os.path.dirname(os.path.dirname(__file__)), use_sudo=True)

BASE_LOCAL_SETTINGS = """RAZZLE_SITE_URL=https://${node_site}
RAZZLE_BACKEND_SITE_URL=https://${django_site}
"""

DJANGO_LOCAL_SETTINGS = """${prefix}_SECRET_KEY=${secret_key}
${site_settings}
${prefix}_ALLOWED_HOSTS=${allowed_hosts}
${prefix}_DATABASE_HOST=postgres
${prefix}_DATABASE_PORT=5432
${prefix}_DATABASE_NAME=bds
${prefix}_DATABASE_USER=bds
${prefix}_DATABASE_PASSWORD=${db_password}
"""


""" TARGETS """


def defaults():
    # Use  .ssh/config  so that you can use hosts defined there.
    env.use_ssh_config = True
    # Forward ctrl+c to the server, giving the running process there a chance to abort, instead of just aborting Fabric
    #  and cutting the connection.
    env.remote_interrupt = True

    env.confirm_required = True

    env.target = 'staging'

    env.code_dir = '/srv/bds'

    env.postgres_version = '12'

    # Mapping of configuration files and their rules
    #
    #  "Directory name inside deploy/": [
    #      {
    #          "pattern": "filename to search for (replacements: target[env.target])",
    #          "filename": "filename used in remote machine (replacements: target[env.target])",
    #          "remote_path": "path on the remote machine where the file/files must be uploaded to (replacements: filename, target)",
    #      },
    #      ...
    #  ]
    #
    env.deployment_configurations = {
        "letsencrypt": [
            {
                "pattern": "%(target)s.conf",
                "filename": "letsencrypt.bds.conf",
                "remote_path": "/etc/letsencrypt/configs/%(filename)s"
            }
        ],
        "nginx": [
            {
                "pattern": "common.include",
                "filename": "app.bds.include",
                "remote_path": "/etc/nginx/conf.d/%(filename)s"
            },
            {
                "pattern": "map_files.include",
                "filename": "app.bds.map_files.include",
                "remote_path": "/etc/nginx/conf.d/%(filename)s"
            },
            {
                "pattern": "common.bds.django.include",
                "filename": "common.bds.django.include",
                "remote_path": "/etc/nginx/conf.d/%(filename)s"
            },
            {
                "pattern": "app.bds.proxy_django.include",
                "filename": "app.bds.proxy_django.include",
                "remote_path": "/etc/nginx/conf.d/%(filename)s"
            },
            {
                "pattern": "common.bds.node.include",
                "filename": "common.bds.node.include",
                "remote_path": "/etc/nginx/conf.d/%(filename)s"
            },
            {
                "pattern": "app.bds.proxy_node.include",
                "filename": "app.bds.proxy_node.include",
                "remote_path": "/etc/nginx/conf.d/%(filename)s"
            },
            {
                "pattern": "app.bds.proxy.include",
                "filename": "app.bds.proxy.include",
                "remote_path": "/etc/nginx/conf.d/%(filename)s"
            },
            {
                "pattern": "%(target)s.ssl",
                "filename": "ssl.bds.include",
                "remote_path": "/etc/nginx/conf.d/%(filename)s"
            },
            {
                "default_site": True,
                "pattern": "%(target)s.conf",
                "filename": "bds",
                "remote_path": "/etc/nginx/sites-enabled/%(filename)s"
            }
        ]
    }


@task(alias="staging")
def test():
    """ TARGET: test server (staging)
    """

    defaults()
    env.node_site = 'bds.test.TODO.com'
    env.django_site = 'office.bds.test.TODO.com'
    env.hosts = ['test.TODO.com']


@task(alias="production")
def live():
    """ TARGET: live server (production)
    """

    raise NotImplemented('TODO: live host not configured')

    defaults()
    env.target = 'production'
    env.node_site = 'TODO.com'
    env.django_site = 'office.TODO.com'
    env.hosts = ['production.TODO.com']


""" ACTIONS """


@task
def show_log(commit_id=None):
    """ List revisions to apply/unapply when updating to given revision.
        When no revision is given, it default to the head of current branch.
        Returns False when there is nothing to apply/unapply. otherwise revset of revisions that will be applied or
        unapplied (this can be passed to `hg|git status` to see which files changed for example).
    """
    result = vcs.deployment_list(commit_id)

    if 'message' in result:
        print(result['message'])
        return False

    current_version = get_current_version_summary()
    print(colors.yellow("Current version: " + current_version))

    if 'forwards' in result:
        print("Revisions to apply:")
        print(indent(result['forwards']))

    elif 'backwards' in result:
        print("Revisions to rollback:")
        print(indent(result['backwards']))

    return result['revset']


@task
def migrate_diff(id=None, revset=None, silent=False):
    """ Check for migrations needed when updating to the given revision. """
    require('code_dir')

    # Exactly one of id and revset must be given
    assert (id or revset) and not (id and revset)

    # no revset given, calculate it by using deployment_list
    if not revset:
        result = vcs.deployment_list(id)

        if 'revset' not in result:
            print(result['message'])
            abort('Nothing to do')

        else:
            revset = result['revset']

    # Pull out migrations
    migrations = vcs.changed_files(revset, "\/(?P<model>\w+)\/migrations\/(?P<migration>.+)")

    if not silent and migrations:
        print("Found %d migrations." % len(migrations))
        print(indent(migrations))

    return migrations


@task
def migrate(silent=False):
    """ Preform migrations on the database. """

    if not silent:
        request_confirm("migrate")

    management_cmd("migrate --noinput")


@task
def version():
    """ Get current target version hash. """
    require('hosts')
    require('code_dir')

    summary = get_current_version_summary()
    print(colors.yellow(summary))


@task
def deploy(id=None, silent=False, force=False, auto_nginx=True):
    """ Perform an automatic deploy to the target requested. """
    require('hosts')
    require('code_dir')

    if force:
        force = colors.blue('FORCED DEPLOY')

        print('-' * 40)
        print(force)
        print('-' * 40)

    # Ask for sudo at the beginning so we don't fail during deployment because of wrong pass
    if not sudo('whoami'):
        abort('Failed to elevate to root')
        return

    # Show log of changes, return if nothing to do
    revset = show_log(id)
    if not revset and not force:
        return

    # Ensure default local.py file exists
    ensure_local_py_exists()

    # See if we have any requirements changes
    requirements_changes = force or vcs.changed_files(revset, r'Pipfile')
    if requirements_changes:
        print(colors.yellow("Will update requirements (and do migrations)"))

    # See if we have any changes to migrations between the revisions we're applying
    migrations = force or migrate_diff(revset=revset, silent=True)
    if migrations:
        print(colors.yellow("Will apply %d migrations:" % len(migrations)))
        print(indent(migrations))

    # See if we have any changes to letsencrypt configurations
    letsencrypt_changed = force or vcs.changed_files(revset, get_config_modified_patterns('letsencrypt'))
    if letsencrypt_changed:
        print(colors.yellow("Will update letsencrypt configurations"))

    # see if nginx conf has changed
    nginx_changed = vcs.changed_files(revset, get_config_modified_patterns('nginx'))

    if nginx_changed:
        if auto_nginx:
            print(colors.yellow("Nginx configuration change detected, updating automatically"))

        else:
            print(colors.red("Warning: Nginx configuration change detected, also run: `fab %target% nginx_update`"))

    elif force:
        print(colors.yellow("Updating nginx config"))

    if not silent:
        request_confirm("deploy")

    vcs.update(id)

    ensure_docker_networks()
    docker_compose('build')

    collectstatic()

    if migrations or requirements_changes:
        migrate(silent=True)

    # Run deploy systemchecks
    check()

    docker_up(silent=True, force_recreate=force)

    # Update nginx after bringing up container
    if force or (nginx_changed and auto_nginx):
        nginx_update()

    if force or letsencrypt_changed:
        letsencrypt_update()


@task
def setup_server(id=None):
    """ Perform initial deploy on the target """
    require('hosts')
    require('code_dir')

    # Clone code repository
    vcs.clone(id or None)

    # Ensure default local.py file exists
    ensure_local_py_exists()

    # Create password for DB and the secret key
    db_password = generate_password()
    secret_key = generate_password()
    allowed_hosts = [env.node_site]

    if env.django_site not in allowed_hosts:
        allowed_hosts.append(env.django_site)

    allowed_hosts = ','.join(allowed_hosts)

    node_site_settings = string.Template(BASE_LOCAL_SETTINGS).substitute(
        node_site=env.node_site, django_site=env.django_site,
    )

    django_site_settings = string.Template(BASE_LOCAL_SETTINGS).substitute(
        node_site=env.node_site, django_site=env.django_site,
    )

    django_local_settings = string.Template(DJANGO_LOCAL_SETTINGS).substitute(
        db_password=db_password, secret_key=secret_key,
        site_settings=django_site_settings,
        allowed_hosts=allowed_hosts,
        prefix='DJANGO',
    )

    # Upload local settings / env files
    node_settings_file = env.code_dir + '/app/.env.production.local'
    django_settings_file = env.code_dir + '/bds/django.env'

    put(local_path=StringIO(node_site_settings), remote_path=node_settings_file, use_sudo=True)
    put(local_path=StringIO(django_local_settings), remote_path=django_settings_file, use_sudo=True)

    # Request additional secrets
    print('Enter Django SENTRY_ENVIRONMENT (staging/production):')
    add_secret_key('DJANGO_SENTRY_ENVIRONMENT', [django_settings_file])

    print('Enter Django SENTRY_DSN:')
    add_secret_key('DJANGO_SENTRY_DSN', [django_settings_file])

    print('Enter Node SENTRY_ENVIRONMENT (staging/production):')
    add_secret_key('RAZZLE_SENTRY_ENVIRONMENT', [node_settings_file])

    print('Enter Node SENTRY_DSN:')
    add_secret_key('RAZZLE_SENTRY_DSN', [node_settings_file])

    print('Enter Django EMAIL_HOST_PASSWORD:')
    add_secret_key('DJANGO_EMAIL_HOST_PASSWORD', [django_settings_file])

    print('Enter Django DJANGO_AWS_ACCESS_KEY_ID:')
    add_secret_key('DJANGO_AWS_ACCESS_KEY_ID', [django_settings_file])

    print('Enter Django DJANGO_AWS_SECRET_ACCESS_KEY:')
    add_secret_key('DJANGO_AWS_SECRET_ACCESS_KEY', [django_settings_file])

    # Create database
    sudo('echo "CREATE DATABASE bds; '
         '      CREATE USER bds WITH password \'{db_password}\'; '
         '      GRANT ALL PRIVILEGES ON DATABASE bds to bds;" '
         '| docker exec -i postgres-{postgres_version} psql -U postgres'.format(db_password=db_password,
                                                                                postgres_version=env.postgres_version))
    # Create log dir
    sudo('mkdir -p /var/log/bds/')

    ensure_docker_networks()

    docker_compose('build')

    # migrations, collectstatic (both django & node)
    migrate(silent=True)
    collectstatic()

    # Copy logrotate conf
    with cd(env.code_dir):
        sudo('cp deploy/logrotate.conf /etc/logrotate.d/bds')

    # (Re)start services
    docker_up(silent=True)

    # Run deploy systemchecks
    check()

    # Configure letsencrypt
    letsencrypt_configure(reconfigure_nginx=False)

    # Install nginx config
    nginx_update()


@task
def nginx_update():
    """ Updates the nginx configuration files and restarts nginx.
    """
    update_config_files('nginx')

    # test nginx configuration before restarting it. This catches config problems which might bring down nginx.
    sudo('docker exec nginx nginx -t')
    sudo('docker exec nginx nginx -s reload')


@task
def letsencrypt_configure(reconfigure_nginx=True):
    require('code_dir')

    domains = set()

    # Collect all the domains that need a certificate
    with cd(env.code_dir):
        # construct a configparser object
        config = ConfigParser.ConfigParser()

        for filename in get_config_repo_paths('letsencrypt'):
            buf = StringIO()

            # Add the actual config file data to the buffer
            get(filename, buf)

            # Here we prepend a section header to the in-memory buffer. This
            #  allows us to easily read the letsencrypt config file using stdlib configparser
            #
            # see: http://stackoverflow.com/questions/2819696/parsing-properties-file-in-python/25493615#25493615
            buf = StringIO('[DEFAULT]\n' + buf.getvalue())

            # read config from buf
            config.readfp(buf)

            # get domains from the config file
            for domain in config.get('DEFAULT', 'domains').split(','):
                domains.add(domain.strip())

    # Create a temporary nginx config file
    temporary_nginx_conf = """
        server {
            listen 80;
            server_name %(domains)s;
            location /.well-known/acme-challenge/ {
                root /etc/letsencrypt/www;
                break;
            }
        }
    """ % {
        "domains": " ".join(domains),
    }

    # Notify the user that the dns MUST be configured for all the domains as of this point
    print(" ")
    print(colors.blue('Preparing to request certificate using letsencrypt. The DNS for '
                      'following domains MUST be configured to point to the remote host: %s' % " ".join(domains)))

    if not confirm(colors.yellow("Is the dns configured? (see above)")):
        abort('Deployment aborted.')

    # Upload it to the app nginx config path
    put(local_path=StringIO(temporary_nginx_conf), remote_path=get_nginx_app_target_path(), use_sudo=True)

    # Reload nginx
    sudo('docker exec nginx nginx -s reload')

    # use letsencrypt_update to obtain the certificate
    letsencrypt_update(dry_run=True)

    # restore nginx config if requested
    if reconfigure_nginx:
        nginx_update()


@task
def letsencrypt_update(dry_run=False):
    require('code_dir')

    updated_files = update_config_files('letsencrypt')

    for target_path in updated_files:
        # verify everything works using --dry-run
        if dry_run:
            sudo("certbot-auto --no-self-upgrade certonly --dry-run --noninteractive --agree-tos -c %s" % target_path)

        # Aquire the certificate
        sudo("certbot-auto --no-self-upgrade certonly --noninteractive --agree-tos -c %s" % target_path)

    # Reload nginx
    sudo('docker exec nginx nginx -s reload')


""" SERVER COMMANDS """


@task
def docker_down(silent=False):
    """ Stops all services
    """

    if not silent:
        request_confirm("docker_down")

    docker_compose('down')


@task
def docker_up(silent=False, force_recreate=False):
    """ Starts all services
    """

    if not silent:
        request_confirm("docker_up")

    docker_compose('up -d --remove-orphans{}'.format(' --force-recreate' if force_recreate else ''))

    # This is necessary to make nginx refresh IP addresses of containers.
    sudo('docker exec nginx nginx -s reload')


@task
def docker_restart(silent=False, force_recreate=False):
    # Stops and then starts all services
    docker_down(silent=silent)
    docker_up(silent=silent, force_recreate=force_recreate)


@task
def management_cmd(cmd):
    """ Perform a management command on the target. """

    return docker_compose_run('django', 'python manage.py ' + cmd)


@task
def check():
    """ Perform Django's deploy systemchecks. """
    require('hosts')
    require('code_dir')

    management_cmd('check --deploy')


@task
def createsuperuser():
    """ Creates new superuser in Django. """
    require('hosts')
    require('code_dir')

    management_cmd('createsuperuser')


@task
def add_secret_keys(component=None):
    if not component:
        print('Missing target component...')
        return

    require('hosts')
    require('code_dir')

    if not sudo('whoami'):
        abort('Failed to elevate to root')
        return
    if component == 'node':
        remote_path = env.code_dir + '/app/.env.production.local'
    else:
        remote_path = env.code_dir + '/bds/django.env'

    while True:
        # Get key name
        key = raw_input('Enter key name: ')

        if not key:
            abort('Missing key name.')

        add_secret_key(key, [remote_path])

        if not confirm(colors.yellow("Add additional secret keys?"), default=False):
            break

    print('To apply the keys, rebuild docker images and restart (force deploy should do it as well)')


""" HELPERS """


def add_secret_key(key, remote_paths, value=None):
    require('code_dir')

    # Get key value
    if value is None:
        value = raw_input('Enter "%s" value: ' % key)

    # Append to correct file if line not exists
    for remote_path in remote_paths:
        append(remote_path, '%s=%s' % (key, value), escape=False, use_sudo=True)


def repo_type():
    require('code_dir')

    try:
        print("Current project is using: `%s`" % colors.green(vcs.NAME))

    except EnvironmentError:
        print("Current project is using: `%s`" % colors.red('NO VCS'))


def collectstatic():
    docker_compose_run('node', 'yarn export-assets', name='bds_yarn_export')
    management_cmd('collectstatic --noinput --ignore styles-src')


def request_confirm(action):
    require('confirm_required')

    if env.confirm_required:
        if not confirm("Are you sure you want to run task: %s on servers %s?" % (action, env.hosts)):
            abort('Deployment aborted.')


def generate_password(length=50):
    # Similar to Django's charset but avoids $ to avoid accidential shell variable expansion
    chars = 'abcdefghijklmnopqrstuvwxyz0123456789!@#%^&*(-_=+)'
    return get_random_string(length, chars)


def get_current_version_summary():
    commit_id, branch, message, author = vcs.version()
    return "%s [%s]: %s - %s" % (commit_id, branch, message, author)


def docker_compose(cmd, fail_on_error=True):
    with cd(env.code_dir):
        res = sudo('docker-compose -f docker-compose.production.yml ' + cmd)

        try:
            return res.stdout
        except:
            if fail_on_error:
                raise


def docker_compose_run(service, cmd='', name='bds_tmp'):
    return docker_compose('run --rm --name {name} {service} {cmd}'.format(name=name, service=service, cmd=cmd))


def get_config_modified_patterns(key):
    return map(lambda x: r' %s' % x, get_config_repo_paths(key))


def get_config_repo_paths(key):
    require('deployment_configurations')

    return map(lambda x: 'deploy/%s/%s' % (key, render_config_key(x, 'pattern')), env.deployment_configurations.get(key, []))


def update_config_files(key):
    require('deployment_configurations')

    paths = []

    with cd(env.code_dir):
        for config_def in env.deployment_configurations.get(key, []):
            repo_path = render_config_key(config_def, 'pattern')
            remote_path = render_config_key(config_def, 'remote_path')

            sudo('cp deploy/%s/%s %s' % (key, repo_path, remote_path))

            paths.append(remote_path)

    return paths


def render_config_key(config_def, key):
    require('target')

    if key == 'pattern' or key == 'filename':
        params = {
            'target': env.target,
        }

    elif key == 'remote_path':
        params = {
            'target': env.target,
            'filename': render_config_key(config_def, 'filename'),
        }

    else:
        return abort('invalid config key: %s' % key)

    return config_def[key] % params


def get_nginx_app_target_path():
    require('deployment_configurations')

    if env.deployment_configurations.get('nginx', None) is None:
        abort('nginx key not in deployment configurations')

    default_site = list(filter(lambda x: x.get('default_site', False), env.deployment_configurations['nginx']))

    if len(default_site) > 1:
        abort('multiple default nginx sites found')

    return render_config_key(default_site[0], 'remote_path')


def ensure_docker_networks():
    # Ensure we have dedicated networks for communicating with Nginx and Postgres
    ensure_docker_network_exists(
        'bds_default', [], internal=False)
    ensure_docker_network_exists(
        'bds_nginx', ['nginx'])
    ensure_docker_network_exists(
        'bds_postgres', ['postgres-{postgres_version}'.format(
        postgres_version=env.postgres_version)])


def ensure_docker_network_exists(network_name, connected_containers, internal=True):
    created = create_docker_network(network_name, internal=internal)

    if not created:
        # Already existed
        return

    for container_name in connected_containers:
        sudo('docker network connect %s %s' % (network_name, container_name))


def ensure_local_py_exists():
    require('hosts')
    require('code_dir')

    django_local_settings = env.code_dir + '/bds/settings/local.py'

    if not exists(django_local_settings, use_sudo=True):
        content = string.Template("from settings.${target} import *\n").substitute(target=env.target)

        put(StringIO(content), django_local_settings, use_sudo=True)


def get_docker_compose_config(local=False):
    if local:
        result = operations.local('docker-compose config', capture=True)
    else:
        result = docker_compose('config', fail_on_error=False)
    try:
        return yaml.load(result)
    except:
        return None


def get_media_dir(local=False):
    config = get_docker_compose_config(local=local)
    media_volume = next(
        (volume for volume in config['services']['django']['volumes'] if '/files/media' in volume),
        None,
    )
    if not media_volume:
        return None

    media_dir = media_volume.split(':')[0]
    return media_dir


def copy_server_media(media_dir, volumes_dir):
    remote_media_dir = get_media_dir(local=False)
    if not remote_media_dir:
        print(colors.red('No media dir found!'))
        return

    project_name = 'bds'
    dump_filename = '%s-media.zip' % project_name
    dump_path = os.path.join('/', 'tmp', dump_filename)
    download_dir = os.path.join(volumes_dir, dump_filename)

    # clean previous dump
    sudo('rm -f %s' % dump_path)

    # f-ing zip does not have a flag to disable parent folder inclusion :(
    with cd(remote_media_dir):
        sudo('sudo zip -r %s *' % dump_path)

    # retrieve and release disk space
    operations.get(dump_path, download_dir)
    operations.local('sudo unzip -o %s -d %s' % (download_dir, media_dir))
    sudo('rm -f %s' % dump_path)


def copy_s3_media(settings, volumes_dir):
    resource = boto3.Session(
        aws_access_key_id=settings['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=settings['AWS_SECRET_ACCESS_KEY'],
    ).resource('s3')
    bucket = resource.Bucket(settings['AWS_STORAGE_BUCKET_NAME'])

    objects = bucket.objects.all()
    objects = sorted(objects, key=lambda o: len(o.key), reverse=True)
    for obj in objects:
        file_path = os.path.join(volumes_dir, obj.key)
        path = os.path.dirname(file_path)
        if not os.path.exists(path):
            os.makedirs(path)
        # we might have objects pretending to be folders
        if not obj.key.endswith('/'):
            bucket.download_file(obj.key, file_path)


@task
def restore_media():
    require('hosts')
    require('code_dir')
    print(colors.blue('Restoring the media from the remote server'))

    # this can fail when it asks you to write your password again, as the std out will be replaced
    std_out = management_cmd(
        'settings --keys '
        'AWS_ACCESS_KEY_ID '
        'AWS_SECRET_ACCESS_KEY '
        'AWS_STORAGE_BUCKET_NAME '
    )

    remote_settings = json.loads(re.search(r"{[^}]*?}", std_out).group())

    # TODO: What if locally we have setup without S3 and on staging is S3? With template upgrade should not be an issue
    is_s3 = remote_settings.get('AWS_ACCESS_KEY_ID', '<unset>') != '<unset>'

    print(colors.blue('Copying media files from ' + ('S3 bucket' if is_s3 else 'remote server')))

    media_dir = get_media_dir(local=True)
    volumes_dir = os.path.dirname(media_dir)

    # You need to be the owner of the ".data/media" directory to allow downloading into .data folder
    user = os.getlogin()

    print(colors.yellow('%s needs to be the owner of the ".data" and ".data/media" directory!' % user))
    if os.path.isdir(volumes_dir):
        operations.local('sudo chown %s %s' % (user, volumes_dir))
    if os.path.isdir(media_dir):
        operations.local('sudo chown %s %s' % (user, media_dir))

    if is_s3:
        copy_s3_media(remote_settings, volumes_dir)
    else:
        copy_server_media(media_dir, volumes_dir)

    print(colors.green('Success!'))


@task
def restore_db():
    require('hosts')
    require('code_dir')
    print(colors.blue('Restoring the database from the remote server'))

    project_name = 'bds'
    dump_filename = '%s-dump.sql' % project_name
    dump_path = os.path.join('/', 'tmp', dump_filename)

    media_dir = get_media_dir(local=True)
    volumes_dir = os.path.dirname(media_dir)

    postgres_dir = os.path.join(volumes_dir, 'postgres')
    file_dir = os.path.join(postgres_dir, dump_filename)
    download_dir = os.path.join(volumes_dir, dump_filename)
    operations.local('docker-compose down')

    if os.path.isdir(postgres_dir):
        if confirm("Do you want to overwrite current postgres database? '%s'" % postgres_dir):
            operations.local('sudo rm -rf %s' % postgres_dir)
        else:
            operations.local('sudo mv %s %s-old' % (postgres_dir, postgres_dir))

    # assert not os.path.isdir(postgres_dir), 'Postgres should have been nuked'
    operations.local('docker-compose up -d --build postgres')

    # TODO: we ensure that the folder is created, but not that the port is active
    for retry in range(0, 30, 2):
        if os.path.isdir(postgres_dir):
            break
        sleep(1)
    print(colors.blue('Postgres cleaned!'))

    # You need to be the owner of the ".data" directory!
    user = os.getlogin()
    operations.local('sudo chown %s %s' % (user, volumes_dir))

    # we could use backupninja to dump postgres also, but currently this allows for more control
    sudo('rm -f %s' % dump_path)
    sudo('docker exec -i $(docker ps -f name=postgres- -lq) '
         'pg_dump -U {project_name}  --format=custom --compress=0 {project_name} '
         '> {dump_path}'.format(project_name=project_name, dump_path=dump_path))

    # retrieve and release disk space
    operations.get(dump_path, download_dir)
    operations.local('sudo mv %s %s' % (download_dir, file_dir))
    sudo('rm -f %s' % dump_path)

    # the pg_restore can throw some warnings and report them as errors,
    # which don't affect the end result and are better left to be handled by the developer
    with warn_only():
        operations.local(
            'docker-compose exec postgres '
            'pg_restore --user {project_name} -d  {project_name} /var/lib/postgresql/data/{dump_filename}'.format(
                dump_filename=dump_filename,
                project_name=project_name,
            ),

        )
    # We can run migrate locally, but sometimes it can contain long datamigration
    # operations.local('docker-compose run --rm django ./manage.py migrate')
    operations.local('docker-compose down')
    print(colors.green('Completed!'))


@task
def local_mirror():
    restore_media()
    restore_db()
