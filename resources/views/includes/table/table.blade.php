@php
  $tableFuncInc= $viewpar['tableFuncInc'] ?? 'includes.table.simpleActionFunc';
 // $actions=$viewpar['table']['actions'][1] ?? [];
 //@include($tableFuncInc) 
 //include('..\resources\views\includes\table\actionFunc.php') ;
@endphp 
@include($tableFuncInc)           
<div class="table-responsive">
    <table class="table table-borderless">
<!-- fejléc -->                        
        <thead>
            <tr>
                @foreach($viewpar['table'] as $key=> $val)

                     
                    @if(isset($viewpar['table_action']['check']))  
                        <th>  
                    <!-- oszzes kijelölése ha kell-->   
                    <input class="checkbox" type="checkbox" name="all" value="true">
                        </th>  
                    @else 
     
                    <th>
                    {{$val[0] ?? $key }}
                    </th>
                    @endif 
                @endforeach
            </tr>
        </thead>
<!-- sorok -->                 
        <tbody>
        @foreach($data['tabledata'] ?? [] as $item)
            <tr>
            @foreach($viewpar['table'] as $key=>$val)
            
                <td> 
                @if(substr($key,0,6)=='action')
               
                    @foreach ($val[1] as $action)                       
                   {!!  actionbutton($action,$viewpar,$item)   !!}
                    @endforeach 
                   
                @else
@php  //----------------------------------------------------------------------------------
              
                   if(substr($key,0,4)=='eval'){   
                    //TODO  az evalnál elegánsabb megoldást találni
                    eval('$value='.$val[1].';');  
                    }  
                    elseif (substr($key,0,4)=='icon'){ //substr() azért kell hogy lehessen indexelni
                        $colorcolname=$val[1]['colorcolname'] ?? 'color';
                        $color=$item[$colorcolname] ?? 'gray';
                        $bgcolorcolname=$val[1]['bgcolorcolname'] ?? 'background';
                        $colname=$val[1]['bgcolorcolname'] ?? 'icon';
                        $bgcolor='';
                        if(isset($item[$bgcolorcolname])) {$bgcolor= ' background-color:'.$item[$bgcolorcolname].';';}
                            $value=' <i style="color:'.$color.';'.$bgcolor.'" class="fa fa-'.$item[$colname].'" aria-hidden="true"></i>';        
                        } 
                    elseif (substr($key,0,4)=='join'){ //substr() azért kell hogy lehessen indexelni
                    $joinfunc=$val[1];
                        $joinvar=$val[2];
                        $value=str_limit($item->$joinfunc->$joinvar, 20, '...');        
                    }
                    elseif (substr($key,0,5)=='files'){
                        $joinfunc=$val[1];
                            $value=''; 
                            foreach($item->$joinfunc as $file){                                
                                $value.='<a class="btn btn-primary btn-sm" href="'.url($viewpar['route']).'/download/'.$file->id.'">'.str_limit($file->name, 20, '...').' </a>&nbsp;';                                              
                        }
                    }
                    else{$value=str_limit($item->$key, 30, '...');}
                    //TODO str_limot paraméterből szabályozható legyen
    //-----------------------------------------------------------------------------------------                
@endphp

                {!! $value !!} 
                </td>
            @endif
                
      
            @endforeach
            </tr>
        @endforeach
        </tbody>
</table>