#include "barrierlist.h"

volatile sig_atomic_t init = 0;

/** a linked list of memory barriers. the first is always empty */
struct barrier_list_t;
struct barrierlist {
    struct barrier* item;
    struct barrierlist* next;
} barrierlist;

/** we use a semaphore to lock this list. pthread_mutex_* functions are not async-signal-safe so cannot be used */
sem_t lock;

void barrierlist_init()
{
    init = 1;
    sem_init(&lock, 0, 1);
}

void barrierlist_add(struct barrier* barrier)
{
    if(init == 0) {
        barrierlist_init();
    }

    sem_wait(&lock);

    // find the end of the list
    struct barrierlist* list = &barrierlist;
    while(list->next != 0) {
        list = list->next;
    }

    struct barrierlist* new = (struct barrierlist*)barrierlist_malloc(sizeof(struct barrierlist));
    new->item = barrier;
    list->next = new;

    sem_post(&lock);
}

void barrierlist_remove(struct barrier* barrier)
{
    if(init == 0) {
        barrierlist_init();
    }

    sem_wait(&lock);

    // remove the barrier from the list and free used memory
    struct barrierlist* list = barrierlist.next;
    struct barrierlist* prev = &barrierlist;
    while(list != 0) {
        if(list->item == barrier) {

            // if this is an atomic operation _match will not be corrupted
            prev->next = list->next;

            barrierlist_free(list);
            break;
        }
        list = list->next;
    }

    sem_post(&lock);
}

struct barrier* barrierlist_match(void* addr)
{
    // iterate the list until we find a match for this address
    struct barrierlist* list = barrierlist.next;
    struct barrier* result;
    struct barrier* item;

    while(list != 0) {
        item = list->item;
        if(addr >= item->start &&
            addr < (item->start + item->size)) {
            result = item;
            break;
        }
        list = list->next;
    }
    return result;
}
