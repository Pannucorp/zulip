import random
import time

from django.http import HttpResponse, Http404
from django.shortcuts import render
from django.templatetags.static import static
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.cache import never_cache
from django.views.generic import TemplateView
import zproject.settings

def service_worker(request):# type: ignore[no-untyped-def] 
    # response = HttpResponse(open(zproject.settings.PWA_SERVICE_WORKER_PATH).read(), content_type='application/javascript')
    response = render(request, 'pwa/serviceworker.js',content_type='application/x-javascript')
    return response


def manifest(request):# type: ignore[no-untyped-def] 
    return render(request, 'pwa/manifest.json', {
        setting_name: getattr(zproject.settings, setting_name)
        for setting_name in dir(zproject.settings)
        if setting_name.startswith('PWA_')
    }, content_type='application/json')

def my_page(request):# type: ignore[no-untyped-def] 
    routes = {
        'Home': reverse('home'),
        'Say hi': reverse('say_something', kwargs={'key': 'hi'}),
        'Say bye': reverse('say_something', kwargs={'key': 'bye'}),
        'Say something invalid': reverse('say_something', kwargs={'key': 'invalid'}),
        'Response in random time': reverse('random_response'),
        'Fill dynamic cache': reverse('fill_dynamic_cache', kwargs={'id': 1}),
        'Must not cache': reverse('must_not_cache'),
    }

    return render(request, 'pwa/my_page.html', context={'routes': routes})


def say_something(request, key):# type: ignore[no-untyped-def] 
    things_to_say = {
        'hi': 'Hello world',
        'bye': 'Have a nice day',
    }

    if key not in things_to_say:
        raise Http404(f'{key} is not a valid thing to say')

    return render(request, 'pwa/say_something.html', context={'thing': things_to_say[key]})


def random_response(request):# type: ignore[no-untyped-def] 
    response_time_ms = random.choice((0, 10, 50, 100, 1_000, 10_000))
    response_time = response_time_ms / 1_000
    print(f'Selected response time {response_time}')
    time.sleep(response_time)
    return render(request, 'pwa/random_response.html', context={'response_time': response_time})


def fill_dynamic_cache(request, id):# type: ignore[no-untyped-def] 
    return render(request, 'pwa/fill_dynamic_cache.html', context={'id': id})


@never_cache
def must_not_cache(request):# type: ignore[no-untyped-def] 
    return render(request, 'pwa/must_not_cache.html', context={'requested_at': timezone.now()})
