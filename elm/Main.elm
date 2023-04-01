module Main exposing (main)
import Browser 
import Css exposing (..)
import Html.Styled exposing (toUnstyled, Html, div, node, input)
import Html.Styled.Attributes exposing (width, css, attribute, placeholder, value)
import Html.Styled.Events exposing (onInput)

main = Browser.element 
  { init = init, 
    update = update,
    subscriptions = subscriptions,
    view = toUnstyled << view
    }

type Msg = Change String

type alias Model = 
  { content : String
  }

init : String -> ( Model, Cmd msg )
init expr = 
  ( { content = expr }
  , Cmd.none)

  
update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
  case msg of
    Change newContent ->
      ( { model | content = newContent}, Cmd.none )

inputHeight = (rem 4)

viewInput : Model -> Html Msg
viewInput model =  
  div [] 
  [ input 
    [ placeholder "expression..."
    , value model.content
    , onInput Change
    , css 
        [  paddingLeft (rem 2.0)
        ,  color (hex "ffffff")
        ,  backgroundColor (hex "151515")
        ,  border3 (px 3) solid (hex "111")
        ,  Css.height inputHeight
        ,  Css.width (pct 100)
        ,  outline none
        ]     
    ] []
  ]

view : Model -> Html Msg
view model =
  div 
    [ css  
      [ boxSizing borderBox
      , fontFamilies ["Roboto Mono", "sans-serif"]
      , backgroundColor (hex "151515")
      , margin auto
      , Css.width (pct 80) ] ]
    [ viewInput model    
    , node "twod-expr-graph"  
      [ attribute "expression" model.content
      , css [ Css.height (calc (vh 100) minus inputHeight)
            , display block
            ]
      ]
    []
    ]

subscriptions : Model -> Sub Msg
subscriptions _ =
  Sub.none